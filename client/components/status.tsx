import type { ContentStatus, JobStatus } from "@/lib/types";
import { CONTENT_STATUS_LABEL, JOB_STATUS_LABEL } from "@/lib/labels";
import { Badge } from "./ui";

const CONTENT_TONE: Record<ContentStatus, "neutral" | "amber" | "green" | "accent"> = {
  DRAFT: "neutral",
  IN_REVIEW: "amber",
  APPROVED: "green",
  SCHEDULED: "accent",
  PUBLISHED: "green",
  ARCHIVED: "neutral",
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={CONTENT_TONE[status]}>{CONTENT_STATUS_LABEL[status]}</Badge>;
}

const JOB_TONE: Record<JobStatus, "neutral" | "amber" | "green" | "red"> = {
  QUEUED: "neutral",
  RUNNING: "amber",
  DONE: "green",
  FAILED: "red",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={JOB_TONE[status]}>{JOB_STATUS_LABEL[status]}</Badge>;
}
