import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePublicationDto {
  @IsUUID()
  pieceId!: string;

  @IsUUID()
  channelId!: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
