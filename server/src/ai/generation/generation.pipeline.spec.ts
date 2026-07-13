import { GenerationResult, LLMProvider } from '../llm/llm-provider.interface';
import { GenerationPipeline } from './generation.pipeline';

describe('GenerationPipeline', () => {
  let pipeline: GenerationPipeline;
  let complete: jest.Mock;

  beforeEach(() => {
    let call = 0;
    complete = jest.fn(async (): Promise<GenerationResult> => {
      call += 1;
      return {
        text: `step-${call}`,
        inputTokens: 10 * call,
        outputTokens: 5 * call,
        model: 'gpt-4o-mini',
      };
    });
    const llm = { complete } as unknown as LLMProvider;
    pipeline = new GenerationPipeline(llm);
  });

  it('chạy đúng 3 bước (outline → draft → SEO)', async () => {
    await pipeline.run('brief');
    expect(complete).toHaveBeenCalledTimes(3);
  });

  it('trả text của bước cuối và cộng dồn token cả pipeline', async () => {
    const out = await pipeline.run('brief');
    expect(out.text).toBe('step-3');
    // input: 10 + 20 + 30 = 60 ; output: 5 + 10 + 15 = 30
    expect(out.inputTokens).toBe(60);
    expect(out.outputTokens).toBe(30);
  });

  it('bước draft nhận dàn ý từ bước outline', async () => {
    await pipeline.run('brief');
    const draftCall = complete.mock.calls[1][0];
    expect(draftCall.user).toContain('step-1');
  });
});
