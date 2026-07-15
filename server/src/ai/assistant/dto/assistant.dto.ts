import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { type AssistantMode, ASSISTANT_MODES } from '../assistant-modes';

export class AssistantDto {
  @IsIn(Object.keys(ASSISTANT_MODES))
  mode!: AssistantMode;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsNotEmpty()
  pieceId!: string;
}
