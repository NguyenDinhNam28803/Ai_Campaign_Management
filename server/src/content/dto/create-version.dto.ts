import { IsString, MinLength } from 'class-validator';

/** Sửa nội dung => tạo ContentVersion mới (HUMAN_EDIT). */
export class CreateVersionDto {
  @IsString()
  @MinLength(1)
  body!: string;
}
