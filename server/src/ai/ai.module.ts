import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { BudgetService } from './budget/budget.service';
import { GenerationController } from './generation/generation.controller';
import { GenerationPipeline } from './generation/generation.pipeline';
import { GenerationProcessor } from './generation/generation.processor';
import {
  GENERATION_QUEUE,
  GenerationService,
} from './generation/generation.service';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { OpenAIProvider } from './llm/openai.provider';
import { RetrievalService } from './retrieval/retrieval.service';

@Module({
  imports: [QueueModule, BullModule.registerQueue({ name: GENERATION_QUEUE })],
  controllers: [GenerationController],
  providers: [
    { provide: LLM_PROVIDER, useClass: OpenAIProvider },
    BudgetService,
    GenerationPipeline,
    GenerationService,
    GenerationProcessor,
    RetrievalService,
  ],
  exports: [LLM_PROVIDER, BudgetService, RetrievalService],
})
export class AiModule {}
