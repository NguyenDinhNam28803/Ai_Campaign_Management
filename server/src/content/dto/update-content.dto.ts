import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/** Chỉ sửa metadata của piece (title, người phụ trách). Nội dung sửa qua versions. */
export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
