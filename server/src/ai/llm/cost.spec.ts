import { estimateCost } from './cost';

describe('estimateCost', () => {
  it('tính đúng theo bảng giá gpt-4o-mini', () => {
    // 1,000,000 input * 0.15 + 1,000,000 output * 0.6 = 0.75
    expect(estimateCost('gpt-4o-mini', 1_000_000, 1_000_000)).toBe(0.75);
  });

  it('token nhỏ ra chi phí nhỏ (làm tròn 6 chữ số)', () => {
    // 1000 in * 0.15/1e6 + 500 out * 0.6/1e6 = 0.00015 + 0.0003 = 0.00045
    expect(estimateCost('gpt-4o-mini', 1000, 500)).toBe(0.00045);
  });

  it('model lạ dùng giá fallback (không ném lỗi)', () => {
    expect(estimateCost('model-khong-ton-tai', 1_000_000, 0)).toBe(0.15);
  });

  it('gpt-4o đắt hơn gpt-4o-mini cùng lượng token', () => {
    const mini = estimateCost('gpt-4o-mini', 10_000, 10_000);
    const full = estimateCost('gpt-4o', 10_000, 10_000);
    expect(full).toBeGreaterThan(mini);
  });
});
