"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import {
  ANALYTICS_PERIOD_LABEL,
  CHART_COLOR_PALETTE,
  METRIC_SOURCE_LABEL,
} from "@/lib/labels";
import type {
  AnalyticsAiCost,
  AnalyticsChannelBreakdown,
  AnalyticsContentPerformance,
  AnalyticsOverview,
  AnalyticsTimelineEntry,
  ProductLine,
} from "@/lib/types";
import {
  Button,
  Card,
  ErrorState,
  Input,
  ListSkeleton,
  PageHeader,
  Select,
} from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/charts";

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-muted/30 bg-card p-5">
      <div className="grid h-10 w-10 flex-none place-items-center rounded-md bg-paper text-muted">
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">{value}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [selectedProductLine, setSelectedProductLine] = useState<string>("");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showImport, setShowImport] = useState(false);

  const { data: productLines } = useApi<ProductLine[]>(
    () => resources.productLines.list(),
    "product-lines",
  );

  const plId = selectedProductLine || productLines?.[0]?.id || "";

  const { data: overview, loading: overviewLoading, error: overviewError, reload: reloadOverview } = useApi<AnalyticsOverview>(
    () => resources.analytics.overview(plId, dateFrom || undefined, dateTo || undefined),
    `analytics-overview-${plId}-${dateFrom}-${dateTo}`,
  );

  const { data: timeline, loading: timelineLoading } = useApi<AnalyticsTimelineEntry[]>(
    () => resources.analytics.timeline(plId, period, dateFrom || undefined, dateTo || undefined),
    `analytics-timeline-${plId}-${period}-${dateFrom}-${dateTo}`,
  );

  const { data: channelBreakdown, loading: channelLoading } = useApi<AnalyticsChannelBreakdown[]>(
    () => resources.analytics.channels(plId, dateFrom || undefined, dateTo || undefined),
    `analytics-channels-${plId}-${dateFrom}-${dateTo}`,
  );

  const { data: contentPerformance, loading: contentLoading } = useApi<AnalyticsContentPerformance[]>(
    () => resources.analytics.content(plId, dateFrom || undefined, dateTo || undefined),
    `analytics-content-${plId}-${dateFrom}-${dateTo}`,
  );

  const { data: aiCost, loading: aiCostLoading } = useApi<AnalyticsAiCost>(
    () => resources.analytics.aiCost(plId || undefined, dateFrom || undefined, dateTo || undefined),
    `analytics-ai-cost-${plId}-${dateFrom}-${dateTo}`,
  );

  if (user && !isManager(user.role)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Phân tích" />
        <Card>
          <p className="text-sm text-muted">Chỉ ADMIN và MANAGER xem được trang phân tích.</p>
        </Card>
      </div>
    );
  }

  const timelineChartData = timeline?.map((t) => ({
    date: t.date,
    values: {
      pageviews: t.pageviews,
      engagements: t.engagements,
      visitors: t.uniqueVisitors,
    },
  })) ?? [];

  const channelChartData = channelBreakdown?.map((ch) => ({
    label: ch.channelName,
    value: ch.totalPageviews,
  })) ?? [];

  const costByModeData = aiCost
    ? Object.entries(aiCost.costByMode).map(([mode, cost]) => ({
        label: METRIC_SOURCE_LABEL[mode as keyof typeof METRIC_SOURCE_LABEL] ?? mode,
        value: cost as number,
      }))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Hiệu suất"
        title="Phân tích"
        subtitle="Đo lường hiệu suất nội dung và chi phí AI."
        action={
          <Button variant="secondary" onClick={() => setShowImport(!showImport)}>
            {showImport ? "Đóng" : "Nhập dữ liệu"}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Dòng sản phẩm
            </label>
            <Select
              value={selectedProductLine}
              onChange={(e) => setSelectedProductLine(e.target.value)}
            >
              <option value="">Tất cả</option>
              {productLines?.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Chu kỳ
            </label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
            >
              <option value="day">{ANALYTICS_PERIOD_LABEL.day}</option>
              <option value="week">{ANALYTICS_PERIOD_LABEL.week}</option>
              <option value="month">{ANALYTICS_PERIOD_LABEL.month}</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Từ
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
              Đến
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Import form */}
      {showImport && <ImportForm onDone={() => { setShowImport(false); reloadOverview(); }} />}

      {/* Overview stats */}
      {overviewError ? (
        <ErrorState message={overviewError} onRetry={reloadOverview} />
      ) : overviewLoading ? (
        <ListSkeleton rows={2} />
      ) : overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox
            label="Lượt xem"
            value={overview.totalPageviews.toLocaleString()}
            icon="📊"
          />
          <StatBox
            label="Khách duy nhất"
            value={overview.totalUniqueVisitors.toLocaleString()}
            icon="👥"
          />
          <StatBox
            label="Tương tác"
            value={overview.totalEngagements.toLocaleString()}
            icon="✨"
          />
          <StatBox
            label="Tỷ lệ tương tác"
            value={`${(overview.engagementRate * 100).toFixed(1)}%`}
            icon="📈"
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline */}
        <Card>
          <h3 className="mb-4 text-sm font-medium text-ink">Xu hướng theo thời gian</h3>
          {timelineLoading ? (
            <ListSkeleton rows={1} />
          ) : (
            <LineChart
              data={timelineChartData}
              series={[
                { key: "pageviews", label: "Lượt xem" },
                { key: "engagements", label: "Tương tác", color: CHART_COLOR_PALETTE[1] },
                { key: "visitors", label: "Khách duy nhất", color: CHART_COLOR_PALETTE[2] },
              ]}
            />
          )}
        </Card>

        {/* Channel breakdown */}
        <Card>
          <h3 className="mb-4 text-sm font-medium text-ink">Hiệu suất theo kênh</h3>
          {channelLoading ? (
            <ListSkeleton rows={1} />
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart data={channelChartData} />
              <div className="flex flex-col gap-2 text-sm">
                {channelBreakdown?.map((ch, i) => (
                  <div key={ch.channelType} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length],
                      }}
                    />
                    <span className="text-muted">{ch.channelName}</span>
                    <span className="ml-auto font-medium">
                      {ch.totalPageviews.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* AI Cost breakdown */}
      <Card>
        <h3 className="mb-4 text-sm font-medium text-ink">Chi phí AI</h3>
        {aiCostLoading ? (
          <ListSkeleton rows={1} />
        ) : aiCost ? (
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-[0.72rem] uppercase text-muted">Tổng chi phí</div>
              <div className="mt-1 text-2xl font-bold">${aiCost.totalCostUsd.toFixed(2)}</div>
              <div className="mt-1 text-xs text-muted">
                {aiCost.generationsCount} lần tạo · ${aiCost.avgCostPerGeneration.toFixed(4)}/lần
              </div>
            </div>
            <div className="sm:col-span-2">
              {costByModeData.length > 0 ? (
                <BarChart
                  data={costByModeData}
                  height={150}
                  formatValue={(v) => `$${v.toFixed(2)}`}
                />
              ) : (
                <p className="text-sm text-muted">Chưa có dữ liệu chi phí.</p>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Content performance table */}
      <Card>
        <h3 className="mb-4 text-sm font-medium text-ink">Hiệu suất nội dung</h3>
        {contentLoading ? (
          <ListSkeleton rows={3} />
        ) : contentPerformance && contentPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4">Tiêu đề</th>
                  <th className="pb-2 pr-4">Loại</th>
                  <th className="pb-2 pr-4 text-right">Đăng</th>
                  <th className="pb-2 pr-4 text-right">Lượt xem</th>
                  <th className="pb-2 pr-4 text-right">Tương tác</th>
                  <th className="pb-2 text-right">Chi phí AI</th>
                </tr>
              </thead>
              <tbody>
                {contentPerformance.map((cp) => (
                  <tr key={cp.pieceId} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-ink">{cp.title}</td>
                    <td className="py-2.5 pr-4 text-muted">{cp.contentType}</td>
                    <td className="py-2.5 pr-4 text-right">{cp.publications}</td>
                    <td className="py-2.5 pr-4 text-right">{cp.totalPageviews.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right">{cp.totalEngagements.toLocaleString()}</td>
                    <td className="py-2.5 text-right">${cp.aiCostUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">Chưa có dữ liệu hiệu suất nội dung.</p>
        )}
      </Card>
    </div>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const [source, setSource] = useState<string>("CSV");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("Cần ít nhất 1 dòng dữ liệu (không tính header)");
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const pubIdIdx = headers.indexOf("publicationid");
      if (pubIdIdx === -1) throw new Error("Thiếu cột publicationId");

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",");
        return {
          publicationId: cols[pubIdIdx]?.trim() ?? "",
          pageviews: parseInt(cols[headers.indexOf("pageviews")] ?? "0") || 0,
          uniqueVisitors: parseInt(cols[headers.indexOf("uniquevisitors")] ?? "0") || 0,
          engagements: parseInt(cols[headers.indexOf("engagements")] ?? "0") || 0,
          conversions: parseInt(cols[headers.indexOf("conversions")] ?? "0") || 0,
          capturedAt: cols[headers.indexOf("capturedat")]?.trim() ?? new Date().toISOString(),
        };
      });

      const res = await resources.analytics.import({ source, rows });
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium text-ink">Nhập dữ liệu phân tích</h3>

      {result ? (
        <div className="rounded-md bg-[#4CAF50]/10 px-4 py-3 text-sm text-[#2E7D32]">
          Đã nhập {result.imported} dòng · Bỏ qua {result.skipped} dòng (publication không tồn tại).
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                  Nguồn
                </label>
                <Select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="CSV">CSV</option>
                  <option value="API">API</option>
                  <option value="MANUAL">Thủ công</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
                Dữ liệu CSV (header: publicationId,pageviews,uniqueVisitors,engagements,conversions,capturedAt)
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-muted/30 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={`publicationId,pageviews,uniqueVisitors,engagements,conversions,capturedAt\nabc-123,100,80,10,2,2026-01-01`}
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-[#b8912f]/25 bg-[#b8912f]/10 px-4 py-2 text-sm text-[#8a6d1f]">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
              {importing ? "Đang nhập..." : "Nhập"}
            </Button>
            <Button variant="secondary" onClick={onDone}>
              Đóng
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
