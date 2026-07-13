import { splitText } from './chunker';

describe('splitText', () => {
  it('gộp đoạn ngắn thành ít nhất 1 chunk', () => {
    const out = splitText('Xin chào. Đây là đoạn ngắn.');
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].content).toContain('Xin chào');
    expect(out[0].tokenCount).toBeGreaterThan(0);
  });

  it('văn bản dài bị cắt thành nhiều chunk (mỗi chunk ≤ ~1500 ký tự)', () => {
    const long = Array.from(
      { length: 60 },
      (_, i) => `Đoạn số ${i} ${'x'.repeat(60)}.`,
    ).join('\n\n');
    const out = splitText(long);
    expect(out.length).toBeGreaterThan(1);
    for (const c of out) expect(c.content.length).toBeLessThanOrEqual(1500);
  });

  it('bỏ khoảng trắng thừa, không tạo chunk rỗng', () => {
    const out = splitText('\n\n   \n\nNội dung.\n\n\n');
    expect(out.every((c) => c.content.trim().length > 0)).toBe(true);
  });

  it('đoạn siêu dài (> MAX) bị cắt cứng', () => {
    const out = splitText('a'.repeat(4000));
    expect(out.length).toBe(3);
    expect(out[0].content.length).toBe(1500);
  });
});
