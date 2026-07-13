/**
 * Bảng giá LLM (USD / 1 triệu token). Cập nhật theo nhà cung cấp.
 * Nguồn token: field `usage` của response — không tự đếm.
 */
interface Price {
  inputPerM: number;
  outputPerM: number;
}

const PRICING: Record<string, Price> = {
  'gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.6 },
  'gpt-4o': { inputPerM: 2.5, outputPerM: 10 },
  'text-embedding-3-small': { inputPerM: 0.02, outputPerM: 0 },
};

const FALLBACK: Price = { inputPerM: 0.15, outputPerM: 0.6 };

/** Ước tính chi phí (USD) cho một lần gọi. Làm tròn 6 chữ số thập phân. */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? FALLBACK;
  const cost =
    (inputTokens / 1_000_000) * p.inputPerM +
    (outputTokens / 1_000_000) * p.outputPerM;
  return Number(cost.toFixed(6));
}
