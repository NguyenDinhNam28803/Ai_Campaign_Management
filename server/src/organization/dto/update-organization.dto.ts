import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyAiBudgetUsd?: number;

  @IsOptional()
  @IsString()
  defaultModel?: string;
}
