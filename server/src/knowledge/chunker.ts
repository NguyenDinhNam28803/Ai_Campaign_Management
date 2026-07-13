const MAX_CHARS = 1500;

/** Chia text theo đoạn, gộp tới ~1500 ký tự/chunk. tokenCount ≈ len/4. */
export function splitText(
  text: string,
): { content: string; tokenCount: number }[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = '';
  for (const p of paragraphs) {
    if (buf && buf.length + p.length + 1 > MAX_CHARS) {
      chunks.push(buf);
      buf = '';
    }
    if (p.length > MAX_CHARS) {
      // đoạn quá dài: cắt cứng
      if (buf) {
        chunks.push(buf);
        buf = '';
      }
      for (let i = 0; i < p.length; i += MAX_CHARS) {
        chunks.push(p.slice(i, i + MAX_CHARS));
      }
    } else {
      buf = buf ? `${buf} ${p}` : p;
    }
  }
  if (buf) chunks.push(buf);

  return chunks.map((content) => ({
    content,
    tokenCount: Math.ceil(content.length / 4),
  }));
}
