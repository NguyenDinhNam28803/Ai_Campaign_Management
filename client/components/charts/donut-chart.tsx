"use client";

import { CHART_COLOR_PALETTE } from "@/lib/labels";

interface DonutChartProps {
  data: Array<{ label: string; value: number }>;
  size?: number;
  formatValue?: (v: number) => string;
}

export function DonutChart({
  data,
  size = 150,
  formatValue = (v) => v.toLocaleString(),
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-4 border-muted/20 text-muted"
        style={{ width: size, height: size }}
      >
        <span className="text-xs">Không có dữ liệu</span>
      </div>
    );
  }

  const radius = (size - 20) / 2;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const percentage = d.value / total;
          const dashLength = circumference * percentage;
          const dashOffset = circumference * (1 - accumulated / total);
          const color = CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length];

          accumulated += d.value;

          return (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-ink">{formatValue(total)}</span>
        <span className="text-[0.6rem] uppercase text-muted">Tổng</span>
      </div>
    </div>
  );
}
