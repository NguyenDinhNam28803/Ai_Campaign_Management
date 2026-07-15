// Kiểu dữ liệu khớp API NestJS.

export type Role = "ADMIN" | "MANAGER" | "EDITOR" | "WRITER";
export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";
export type ContentType = "BLOG" | "SOCIAL" | "EMAIL" | "LANDING";
export type ContentStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";
export type VersionSource = "AI_DRAFT" | "HUMAN_EDIT" | "AI_REFINE";
export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "COMMENT";
export type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";
export type AssistantMode =
  | "rewrite"
  | "expand"
  | "summarize"
  | "translate"
  | "tone";

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

export interface Organization {
  id: string;
  name: string;
  monthlyAiBudgetUsd: string;
  aiSpendPeriodUsd: string;
  defaultModel: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface VoiceProfile {
  tone?: string;
  audience?: string;
  do?: string;
  dont?: string;
}

export interface ProductLine {
  id: string;
  name: string;
  slug: string;
  status: string;
  voiceProfile?: VoiceProfile | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  productLineId: string;
  name: string;
  goal: string | null;
  status: string;
  createdAt: string;
}

export interface ContentVersion {
  id: string;
  pieceId: string;
  versionNumber: number;
  body: string;
  source: VersionSource;
  createdAt: string;
}

export interface ContentPiece {
  id: string;
  productLineId: string;
  campaignId: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  currentVersionId: string | null;
  createdBy: string;
  assigneeId: string | null;
  currentVersion?: ContentVersion | null;
  updatedAt: string;
}

export type IngestStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type SourceType =
  | "BRAND_GUIDELINE"
  | "PRODUCT_DOC"
  | "PAST_ARTICLE"
  | "URL";

export interface KnowledgeSource {
  id: string;
  name: string;
  sourceType: SourceType;
  productLineId: string | null;
  status: IngestStatus;
  createdAt: string;
}

export interface AIGeneration {
  id: string;
  status: JobStatus;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type ChannelType =
  | "WORDPRESS"
  | "GHOST"
  | "FACEBOOK"
  | "LINKEDIN"
  | "X";
export type ChannelStatus = "ACTIVE" | "DISCONNECTED";
export type PublishStatus =
  | "PENDING"
  | "PUBLISHING"
  | "LIVE"
  | "FAILED";

export interface Channel {
  id: string;
  productLineId: string;
  type: ChannelType;
  name: string;
  config: Record<string, unknown>;
  status: ChannelStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  productLineId: string;
  pieceId: string;
  versionId: string;
  channelId: string;
  status: PublishStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalId: string | null;
  externalUrl: string | null;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  channel?: { name: string; type: ChannelType };
}

export interface MetricSnapshot {
  id: string;
  productLineId: string;
  publicationId: string;
  source: MetricSource;
  pageviews: number;
  uniqueVisitors: number;
  engagements: number;
  conversions: number;
  rawMetrics: Record<string, unknown> | null;
  capturedAt: string;
  createdAt: string;
}

export type MetricSource = "MANUAL" | "API" | "CSV";

export interface AnalyticsOverview {
  totalPageviews: number;
  totalUniqueVisitors: number;
  totalEngagements: number;
  totalConversions: number;
  engagementRate: number;
  topContent: Array<{
    pieceId: string;
    title: string;
    pageviews: number;
  }>;
}

export interface AnalyticsTimelineEntry {
  date: string;
  pageviews: number;
  uniqueVisitors: number;
  engagements: number;
}

export interface AnalyticsChannelBreakdown {
  channelType: string;
  channelName: string;
  publications: number;
  totalPageviews: number;
  totalEngagements: number;
}

export interface AnalyticsContentPerformance {
  pieceId: string;
  title: string;
  contentType: string;
  status: string;
  publications: number;
  totalPageviews: number;
  totalEngagements: number;
  aiCostUsd: number;
}

export interface AnalyticsAiCost {
  totalCostUsd: number;
  costByMode: Record<string, number>;
  costByModel: Record<string, number>;
  generationsCount: number;
  avgCostPerGeneration: number;
}
