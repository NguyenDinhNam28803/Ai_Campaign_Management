import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AssistantService } from './assistant.service';
import { AssistantDto } from './dto/assistant.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('stream')
  async stream(@Body() dto: AssistantDto, @Res() res: Response) {
    await this.assistant.streamRaw(dto, res);
  }
}
