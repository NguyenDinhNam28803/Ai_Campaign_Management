import { Inject, Injectable, Logger } from '@nestjs/common';
import type { NsConfigType } from '../../config/config.types';
import ollamaConfig from '../../config/ollama.config';
import {
  CompleteParams,
  GenerationResult,
  LLMProvider,
} from './llm-provider.interface';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message: { content: string };
  eval_count: number;
  prompt_eval_count: number;
  model: string;
}

interface OllamaChatStreamResponse {
  message: { content: string };
  done: boolean;
  eval_count?: number;
  prompt_eval_count?: number;
  model: string;
}

@Injectable()
export class OllamaProvider implements LLMProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(
    @Inject(ollamaConfig.KEY)
    private readonly config: NsConfigType<typeof ollamaConfig>,
  ) {
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.model;
    this.logger.log(`Ollama config: baseUrl=${this.baseUrl}, model=${this.defaultModel}`);
  }

  async complete({
    system,
    user,
    model,
  }: CompleteParams): Promise<GenerationResult> {
    const messages: OllamaMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model ?? this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const data: OllamaChatResponse = await res.json();

    return {
      text: data.message?.content ?? '',
      inputTokens: data.prompt_eval_count ?? 0,
      outputTokens: data.eval_count ?? 0,
      model: data.model ?? this.defaultModel,
    };
  }

  async *stream({ system, user, model }: CompleteParams): AsyncIterable<string> {
    const modelToUse = model ?? this.defaultModel;
    this.logger.debug(`Ollama stream: model=${modelToUse}, baseUrl=${this.baseUrl}`);

    const messages: OllamaMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk: OllamaChatStreamResponse = JSON.parse(line);
          if (chunk.message?.content) {
            yield chunk.message.content;
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.defaultModel,
        prompt: text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama embed error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.embedding ?? [];
  }
}
