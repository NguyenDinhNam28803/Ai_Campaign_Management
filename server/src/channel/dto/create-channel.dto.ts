import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ChannelType } from '@prisma/client';

export class CreateChannelDto {
  @IsUUID()
  productLineId!: string;

  @IsEnum(ChannelType)
  type!: ChannelType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  config!: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  credentials!: string;
}
