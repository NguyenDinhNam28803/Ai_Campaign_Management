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
