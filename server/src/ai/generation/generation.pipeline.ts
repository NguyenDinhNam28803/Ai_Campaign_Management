import { Inject, Injectable } from '@nestjs/common';
import {
  LLM_PROVIDER,
  type GenerationResult,
  type LLMProvider,
} from '../llm/llm-provider.interface';

export interface PipelineOutput {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Sinh nội dung đa bước: outline → draft → SEO.
 * Mỗi bước một nhiệm vụ rõ (chất lượng cao hơn), cộng dồn token qua acc().
 */
@Injectable()
export class GenerationPipeline {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LLMProvider) {}

  async run(
    brief: string,
    chunks: Array<{ content: string }> = [],
  ): Promise<PipelineOutput> {
    const context = chunks.map((c) => c.content).join('\n---\n');
    let inT = 0;
    let outT = 0;
    const acc = (r: GenerationResult) => {
      inT += r.inputTokens;
      outT += r.outputTokens;
      return r.text;
    };

    const outline = acc(
      await this.llm.complete({
        system:
          'Bạn là biên tập viên. Tạo DÀN Ý ngắn gọn bám sát ngữ cảnh thương hiệu.',
        user: `Brief:\n${brief}\n\nNgữ cảnh thương hiệu:\n${context || '(chưa có)'}`,
      }),
    );

    const draft = acc(
      await this.llm.complete({
        system:
          'Viết bài hoàn chỉnh theo dàn ý, giữ đúng giọng văn trong ngữ cảnh.',
        user: `Dàn ý:\n${outline}\n\nNgữ cảnh:\n${context || '(chưa có)'}`,
      }),
    );

    const final = acc(
      await this.llm.complete({
        system: 'Tối ưu SEO: tiêu đề, meta, heading — KHÔNG đổi giọng văn.',
        user: draft,
      }),
    );

    return { text: final, inputTokens: inT, outputTokens: outT };
  }
}
