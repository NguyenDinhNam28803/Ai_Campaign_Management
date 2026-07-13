// Tầng resource: gom mọi endpoint API vào một nơi (typed) — không rải magic-string.
import { api } from "./api";
import type {
  AIGeneration,
  Campaign,
  ContentPiece,
  ContentVersion,
  KnowledgeSource,
  Organization,
  ProductLine,
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
};
