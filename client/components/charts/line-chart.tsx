"use client";

import { CHART_COLOR_PALETTE } from "@/lib/labels";

interface LineChartProps {
  data: Array<{ date: string; values: Record<string, number> }>;
  series: Array<{ key: string; label: string; color?: string }>;
  height?: number;
  formatValue?: (v: number) => string;
}

export function LineChart({
  data,
  series,
  height = 200,
  formatValue = (v) => v.toLocaleString(),
}: LineChartProps) {
  const allValues = data.flatMap((d) =>
    series.map((s) => d.values[s.key] ?? 0),
  );
  const max = Math.max(...allValues, 1);

  const points = series.map((s, si) => {
    const coords = data.map((d, di) => {
      const x = (di / Math.max(data.length - 1, 1)) * 90 + 5;
      const y = height - 25 - ((d.values[s.key] ?? 0) / max) * (height - 35);
      return `${x},${y}`;
    });
    return {
      ...s,
      color: s.color ?? CHART_COLOR_PALETTE[si % CHART_COLOR_PALETTE.length],
      path: coords.join(" "),
    };
  });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - 25 - ratio * (height - 35);
          return (
            <line
              key={ratio}
              x1="5"
              y1={y}
              x2="95"
              y2={y}
              stroke="currentColor"
              className="text-muted/20"
              strokeWidth="0.2"
            />
          );
        })}

        {/* Lines */}
        {points.map((p) => (
          <polyline
            key={p.key}
            points={p.path}
            fill="none"
            stroke={p.color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* X-axis labels */}
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => (
          <text
            key={d.date}
            x={5 + (data.indexOf(d) / Math.max(data.length - 1, 1)) * 90}
            y={height - 6}
            textAnchor="middle"
            className="fill-muted text-[2.5px]"
          >
            {d.date.slice(5)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s, si) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  s.color ?? CHART_COLOR_PALETTE[si % CHART_COLOR_PALETTE.length],
              }}
            />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
