import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiMode, AiStep, JobStatus } from '@prisma/client';
import {
  LLM_PROVIDER,
  type LLMProvider,
} from '../llm/llm-provider.interface';
import { BudgetService } from '../budget/budget.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AssistantDto } from './dto/assistant.dto';
import { ASSISTANT_MODES } from './assistant-modes';
import type { Response } from 'express';

export interface SseChunk {
  text: string;
  done: boolean;
  generationId?: string;
  costUsd?: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly modelName: string;

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LLMProvider,
    private readonly prisma: PrismaService,
    private readonly budget: BudgetService,
    private readonly config: ConfigService,
  ) {
    this.modelName = this.config.get<string>('ollama.model') ?? 'ai-content';
    this.logger.log(`AssistantService: model=${this.modelName}`);
  }

  async streamRaw(dto: AssistantDto, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      await this.budget.assertWithinBudget();

      const piece = await this.prisma.contentPiece.findFirst({
        where: { id: dto.pieceId, deletedAt: null },
      });
      if (!piece) {
        throw new NotFoundException('Không tìm thấy nội dung');
      }

      const config = ASSISTANT_MODES[dto.mode];
      const gen = await this.prisma.aIGeneration.create({
        data: {
          productLineId: piece.productLineId,
          pieceId: piece.id,
          mode: AiMode.ASSISTANT,
          step: AiStep.ASSIST_REWRITE,
          status: JobStatus.RUNNING,
          model: this.modelName,
          promptVersion: 'assist-v1',
          createdBy: 'system',
        },
      });

      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;

      const stream = this.llm.stream({
        system: config.system,
        user: dto.text,
      });

      for await (const chunk of stream) {
        fullText += chunk;
        outputTokens += Math.ceil(chunk.length / 4);
        res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
      }

      // Self-hosted model: cost = $0
      const cost = 0;

      await this.prisma.$transaction([
        this.prisma.aIGeneration.update({
          where: { id: gen.id },
          data: {
            status: JobStatus.DONE,
            inputTokens,
            outputTokens,
            costUsd: cost,
            completedAt: new Date(),
          },
        }),
      ]);

      res.write(`data: ${JSON.stringify({ text: '', done: true, generationId: gen.id, costUsd: cost.toString() })}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Assistant stream error: ${message}`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
