import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/decorators/current-user.decorator';

/** ADMIN/MANAGER/EDITOR sửa mọi nội dung; WRITER chỉ nội dung của mình. */
export function canEditPiece(
  user: AuthUser,
  piece: { createdBy: string; assigneeId: string | null },
): boolean {
  if (user.role !== Role.WRITER) {
    return true;
  }
  return piece.createdBy === user.userId || piece.assigneeId === user.userId;
}

export function assertCanEditPiece(
  user: AuthUser,
  piece: { createdBy: string; assigneeId: string | null },
): void {
  if (!canEditPiece(user, piece)) {
    throw new ForbiddenException('WRITER chỉ được thao tác nội dung của mình');
  }
}
