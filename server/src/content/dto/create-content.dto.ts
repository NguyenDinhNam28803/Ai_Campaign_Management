import { ContentType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateContentDto {
  @IsUUID()
  campaignId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
