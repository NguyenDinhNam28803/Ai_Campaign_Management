import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProductLineDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsOptional()
  @IsObject()
  voiceProfile?: Record<string, unknown>;
}
