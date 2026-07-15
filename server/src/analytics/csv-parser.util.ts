export interface ParsedMetricRow {
  publicationId: string;
  pageviews: number;
  uniqueVisitors: number;
  engagements: number;
  conversions: number;
  capturedAt: string;
}

export function parseMetricsCsv(csv: string): ParsedMetricRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV phải có header và ít nhất 1 dòng dữ liệu');
  }

  const header = lines[0]
    .toLowerCase()
    .split(',')
    .map((h) => h.trim());

  const required = ['publicationid', 'pageviews', 'capturedat'];
  for (const r of required) {
    if (!header.includes(r)) {
      throw new Error(`Thiếu cột bắt buộc: ${r}`);
    }
  }

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    header.forEach((h, j) => (row[h] = values[j] || ''));

    return {
      publicationId: row.publicationid,
      pageviews: parseInt(row.pageviews || '0', 10),
      uniqueVisitors: parseInt(row.uniquevisitors || '0', 10),
      engagements: parseInt(row.engagements || '0', 10),
      conversions: parseInt(row.conversions || '0', 10),
      capturedAt: row.capturedat,
    };
  });
}
