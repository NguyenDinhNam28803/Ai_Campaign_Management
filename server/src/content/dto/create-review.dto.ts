import { ReviewDecision } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @IsOptional()
  @IsString()
  comment?: string;
}
