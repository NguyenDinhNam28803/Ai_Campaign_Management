import { SourceType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateKnowledgeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(SourceType)
  sourceType!: SourceType;

  /** Bỏ trống = dùng chung toàn công ty (company-wide, product_line_id = NULL). */
  @IsOptional()
  @IsUUID()
  productLineId?: string;

  @IsString()
  @MinLength(1)
  content!: string;
}
