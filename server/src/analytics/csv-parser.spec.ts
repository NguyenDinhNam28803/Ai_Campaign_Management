import { parseMetricsCsv } from './csv-parser.util';

describe('parseMetricsCsv', () => {
  it('parses valid CSV', () => {
    const csv = `publicationId,pageviews,uniqueVisitors,engagements,conversions,capturedAt
abc-123,100,80,10,2,2026-01-01
def-456,200,150,25,5,2026-01-02`;

    const rows = parseMetricsCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].publicationId).toBe('abc-123');
    expect(rows[0].pageviews).toBe(100);
    expect(rows[1].pageviews).toBe(200);
  });

  it('throws on empty CSV', () => {
    expect(() => parseMetricsCsv('')).toThrow('ít nhất 1 dòng');
  });

  it('throws on missing required column', () => {
    const csv = `pageviews,capturedAt
100,2026-01-01`;
    expect(() => parseMetricsCsv(csv)).toThrow('publicationid');
  });

  it('defaults missing optional columns to 0', () => {
    const csv = `publicationId,pageviews,capturedAt
abc-123,50,2026-01-01`;

    const rows = parseMetricsCsv(csv);
    expect(rows[0].uniqueVisitors).toBe(0);
    expect(rows[0].engagements).toBe(0);
    expect(rows[0].conversions).toBe(0);
  });
});
