// Nhãn hiển thị tiếng Việt cho các enum — NGUỒN DUY NHẤT.
// Mọi nơi hiển thị trạng thái/loại phải lấy nhãn từ đây, không viết chuỗi rời
// hay để lộ enum thô (DRAFT, IN_REVIEW…).
import type {
  ContentStatus,
  ContentType,
  JobStatus,
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
