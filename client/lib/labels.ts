// Nhãn hiển thị tiếng Việt cho các enum — NGUỒN DUY NHẤT.
// Mọi nơi hiển thị trạng thái/loại phải lấy nhãn từ đây, không viết chuỗi rời
// hay để lộ enum thô (DRAFT, IN_REVIEW…).
import type {
  AssistantMode,
  ChannelStatus,
  ChannelType,
  ContentStatus,
  ContentType,
  JobStatus,
  MetricSource,
  PublishStatus,
  VersionSource,
} from "./types";

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Nháp",
  IN_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã đăng",
  ARCHIVED: "Lưu trữ",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  QUEUED: "Đang chờ",
  RUNNING: "Đang chạy",
  DONE: "Xong",
  FAILED: "Thất bại",
};

export const VERSION_SOURCE_LABEL: Record<VersionSource, string> = {
  AI_DRAFT: "AI nháp",
  HUMAN_EDIT: "Người sửa",
  AI_REFINE: "AI tinh chỉnh",
};

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  BLOG: "Blog",
  SOCIAL: "Mạng xã hội",
  EMAIL: "Email",
  LANDING: "Landing",
};

export const ASSISTANT_MODE_LABEL: Record<AssistantMode, string> = {
  rewrite: "Viết lại",
  expand: "Mở rộng",
  summarize: "Tóm tắt",
  translate: "Dịch",
  tone: "Đổi giọng",
};

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  WORDPRESS: "WordPress",
  GHOST: "Ghost",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  X: "X (Twitter)",
};

export const CHANNEL_STATUS_LABEL: Record<ChannelStatus, string> = {
  ACTIVE: "Đang hoạt động",
  DISCONNECTED: "Đã ngắt",
};

export const PUBLISH_STATUS_LABEL: Record<PublishStatus, string> = {
  PENDING: "Đang chờ",
  PUBLISHING: "Đang đăng",
  LIVE: "Đã đăng",
  FAILED: "Thất bại",
};

export const METRIC_SOURCE_LABEL: Record<MetricSource, string> = {
  MANUAL: "Thủ công",
  API: "API",
  CSV: "Tệp CSV",
};

export const ANALYTICS_PERIOD_LABEL: Record<string, string> = {
  day: "Theo ngày",
  week: "Theo tuần",
  month: "Theo tháng",
};

export const CHART_COLOR_PALETTE = [
  "#C26B5B",
  "#3B7DD8",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
];
