import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetricSource } from '@prisma/client';

export class MetricRowDto {
  @IsString()
  publicationId!: string;

  @IsInt()
  @Min(0)
  pageviews!: number;

  @IsInt()
  @Min(0)
  uniqueVisitors!: number;

  @IsInt()
  @Min(0)
  engagements!: number;

  @IsInt()
  @Min(0)
  conversions!: number;

  @IsOptional()
  rawMetrics?: Record<string, unknown>;

  @IsDateString()
  capturedAt!: string;
}

export class ImportMetricsDto {
  @IsEnum(MetricSource)
  source!: MetricSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricRowDto)
  rows!: MetricRowDto[];
}
