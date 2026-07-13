import { BadRequestException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

/**
 * Luật chuyển trạng thái nội dung — chốt chặn DUY NHẤT (§20 tài liệu).
 * Thêm trạng thái mới chỉ sửa ở đây, không rải if khắp controller.
 */
export const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.DRAFT]: [ContentStatus.IN_REVIEW],
  [ContentStatus.IN_REVIEW]: [ContentStatus.DRAFT, ContentStatus.APPROVED],
  [ContentStatus.APPROVED]: [
    ContentStatus.DRAFT,
    ContentStatus.SCHEDULED,
    ContentStatus.PUBLISHED,
  ],
  [ContentStatus.SCHEDULED]: [ContentStatus.PUBLISHED],
  [ContentStatus.PUBLISHED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [],
};

export function canTransition(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ContentStatus,
  to: ContentStatus,
): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Chuyển trạng thái không hợp lệ: ${from} → ${to}`,
    );
  }
}
