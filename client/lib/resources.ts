// Tầng resource: gom mọi endpoint API vào một nơi (typed) — không rải magic-string.
import { api } from "./api";
import type {
  AIGeneration,
  AnalyticsAiCost,
  AnalyticsChannelBreakdown,
  AnalyticsContentPerformance,
  AnalyticsOverview,
  AnalyticsTimelineEntry,
  Campaign,
  Channel,
  ChannelType,
  ContentPiece,
  ContentVersion,
  KnowledgeSource,
  MetricSnapshot,
  Organization,
  ProductLine,
  Publication,
  Role,
  User,
} from "./types";

const qs = (params: Record<string, string | undefined>) => {
  const p = Object.entries(params).filter(([, v]) => v);
  return p.length ? `?${p.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
};

export const resources = {
  organization: {
    get: () => api<Organization>("/organization"),
    update: (body: Partial<Pick<Organization, "name" | "defaultModel">> & { monthlyAiBudgetUsd?: number }) =>
      api<Organization>("/organization", { method: "PATCH", body }),
  },

  users: {
    list: () => api<User[]>("/users"),
    create: (body: { email: string; fullName: string; password: string; role: Role }) =>
      api<User>("/users", { method: "POST", body }),
    disable: (id: string) => api(`/users/${id}`, { method: "DELETE" }),
  },

  productLines: {
    list: () => api<ProductLine[]>("/product-lines"),
    get: (id: string) => api<ProductLine>(`/product-lines/${id}`),
    create: (body: { name: string; slug: string }) =>
      api<ProductLine>("/product-lines", { method: "POST", body }),
    update: (id: string, body: Partial<Pick<ProductLine, "name" | "slug" | "voiceProfile">>) =>
      api<ProductLine>(`/product-lines/${id}`, { method: "PATCH", body }),
  },

  campaigns: {
    list: (productLineId?: string) => api<Campaign[]>(`/campaigns${qs({ productLineId })}`),
    get: (id: string) => api<Campaign>(`/campaigns/${id}`),
    create: (body: { productLineId: string; name: string; goal?: string }) =>
      api<Campaign>("/campaigns", { method: "POST", body }),
  },

  content: {
    list: (params: { campaignId?: string; status?: string } = {}) =>
      api<ContentPiece[]>(`/content${qs(params)}`),
    get: (id: string) => api<ContentPiece>(`/content/${id}`),
    versions: (id: string) => api<ContentVersion[]>(`/content/${id}/versions`),
    create: (body: { campaignId: string; title: string; contentType: string; body: string }) =>
      api<ContentPiece>("/content", { method: "POST", body }),
    addVersion: (id: string, body: string) =>
      api(`/content/${id}/versions`, { method: "POST", body: { body } }),
    submit: (id: string) => api(`/content/${id}/submit`, { method: "POST" }),
    reopen: (id: string) => api(`/content/${id}/reopen`, { method: "POST" }),
    review: (id: string, decision: string, comment?: string) =>
      api(`/content/${id}/reviews`, { method: "POST", body: { decision, comment } }),
    generate: (id: string) =>
      api<{ generationId: string }>(`/content/${id}/generate`, { method: "POST" }),
  },

  generations: {
    get: (id: string) => api<AIGeneration>(`/generations/${id}`),
  },

  knowledge: {
    list: (productLineId?: string) => api<KnowledgeSource[]>(`/knowledge${qs({ productLineId })}`),
    get: (id: string) => api<KnowledgeSource>(`/knowledge/${id}`),
  },

  channels: {
    list: (productLineId?: string) =>
      api<Channel[]>(`/channels${qs({ productLineId })}`),
    get: (id: string) => api<Channel>(`/channels/${id}`),
    create: (body: {
      productLineId: string;
      type: ChannelType;
      name: string;
      config: Record<string, unknown>;
      credentials: string;
    }) => api<Channel>("/channels", { method: "POST", body }),
    update: (
      id: string,
      body: Partial<{ name: string; config: Record<string, unknown>; credentials: string }>,
    ) => api<Channel>(`/channels/${id}`, { method: "PATCH", body }),
    remove: (id: string) => api(`/channels/${id}`, { method: "DELETE" }),
  },

  publications: {
    list: (params: {
      pieceId?: string;
      channelId?: string;
      status?: string;
    } = {}) => api<Publication[]>(`/publications${qs(params)}`),
    get: (id: string) => api<Publication>(`/publications/${id}`),
    create: (body: {
      pieceId: string;
      channelId: string;
      scheduledAt?: string;
    }) => api<Publication>("/publications", { method: "POST", body }),
    publish: (id: string) =>
      api(`/publications/${id}/publish`, { method: "POST" }),
    schedule: (id: string, scheduledAt: string) =>
      api(`/publications/${id}/schedule`, {
        method: "PATCH",
        body: { scheduledAt },
      }),
  },

  analytics: {
    import: (body: {
      source: string;
      rows: Array<{
        publicationId: string;
        pageviews?: number;
        uniqueVisitors?: number;
        engagements?: number;
        conversions?: number;
        capturedAt: string;
      }>;
    }) => api<{ imported: number; skipped: number }>("/analytics/import", { method: "POST", body }),

    overview: (productLineId: string, from?: string, to?: string) =>
      api<AnalyticsOverview>(`/analytics/overview${qs({ productLineId, from, to })}`),

    timeline: (productLineId: string, period?: string, from?: string, to?: string) =>
      api<AnalyticsTimelineEntry[]>(`/analytics/timeline${qs({ productLineId, period, from, to })}`),

    channels: (productLineId: string, from?: string, to?: string) =>
      api<AnalyticsChannelBreakdown[]>(`/analytics/channels${qs({ productLineId, from, to })}`),

    content: (productLineId: string, from?: string, to?: string) =>
      api<AnalyticsContentPerformance[]>(`/analytics/content${qs({ productLineId, from, to })}`),

    aiCost: (productLineId?: string, from?: string, to?: string) =>
      api<AnalyticsAiCost>(`/analytics/ai-cost${qs({ productLineId, from, to })}`),
  },
};
