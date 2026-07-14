/** Vòng tiến độ (donut) — phẳng, màu truyền vào (accent/semantic). */
export function Ring({
  pct,
  size = 150,
  stroke = 14,
  color = "var(--color-accent)",
  centerTop,
  centerBottom,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  centerTop?: string;
  centerBottom?: string;
}) {
  const p = Math.min(100, Math.max(0, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeOpacity={0.18}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-bold tracking-tight text-ink">
            {centerTop ?? `${Math.round(p)}%`}
          </div>
          <div className="text-[0.72rem] uppercase tracking-wide text-muted">
            {centerBottom ?? "đã dùng"}
          </div>
        </div>
      </div>
    </div>
  );
}
