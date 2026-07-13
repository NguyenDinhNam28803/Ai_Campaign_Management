export interface GenerationResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface CompleteParams {
  system: string;
  user: string;
  model?: string;
}

/**
 * Trừu tượng hóa LLM — mọi nơi chỉ phụ thuộc interface này, không phụ thuộc OpenAI.
 * Đổi sang Claude/FPT AI chỉ cần thay binding của LLM_PROVIDER.
 */
export interface LLMProvider {
  complete(p: CompleteParams): Promise<GenerationResult>;
  stream(p: CompleteParams): AsyncIterable<string>;
  embed(text: string): Promise<number[]>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
