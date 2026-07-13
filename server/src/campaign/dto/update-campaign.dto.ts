import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CampaignStatus } from '@prisma/client';
import { CreateCampaignDto } from './create-campaign.dto';

/** Cập nhật campaign: mọi field trừ productLineId (không đổi chủ), thêm status. */
export class UpdateCampaignDto extends PartialType(
  OmitType(CreateCampaignDto, ['productLineId'] as const),
) {
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
