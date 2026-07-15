"use client";

import { CHART_COLOR_PALETTE } from "@/lib/labels";

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 200,
  color = CHART_COLOR_PALETTE[0],
  formatValue = (v) => v.toLocaleString(),
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, (100 / data.length) * 0.7);
  const gap = (100 - barWidth * data.length) / (data.length + 1);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const x = gap + i * (barWidth + gap);
          const barH = (d.value / max) * (height - 30);
          const y = height - 20 - barH;

          return (
            <g key={d.label}>
              <rect
                x={`${x}%`}
                y={y}
                width={`${barWidth}%`}
                height={barH}
                fill={color}
                rx={2}
                className="transition-all duration-300"
              />
              <text
                x={`${x + barWidth / 2}%`}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted text-[3px]"
              >
                {d.label}
              </text>
              <text
                x={`${x + barWidth / 2}%`}
                y={y - 2}
                textAnchor="middle"
                className="fill-ink text-[3px]"
              >
                {formatValue(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
