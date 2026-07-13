import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NsConfigType } from '../../config/config.types';
import OpenAI from 'openai';
import openaiConfig from '../../config/openai.config';
import {
  CompleteParams,
  GenerationResult,
  LLMProvider,
} from './llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(
    @Inject(openaiConfig.KEY)
    private readonly config: NsConfigType<typeof openaiConfig>,
  ) {
    if (!config.apiKey) {
      this.logger.warn('OPENAI_API_KEY chưa cấu hình — gọi LLM sẽ lỗi.');
    }
    this.client = new OpenAI({ apiKey: config.apiKey || 'missing' });
    this.defaultModel = config.model;
  }

  async complete({
    system,
    user,
    model,
  }: CompleteParams): Promise<GenerationResult> {
    const res = await this.client.chat.completions.create({
      model: model ?? this.defaultModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return {
      text: res.choices[0]?.message?.content ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0, // LẤY token từ API
      outputTokens: res.usage?.completion_tokens ?? 0,
      model: res.model,
    };
  }

  async *stream({ system, user, model }: CompleteParams): AsyncIterable<string> {
    const s = await this.client.chat.completions.create({
      model: model ?? this.defaultModel,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    for await (const chunk of s) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  }
}
