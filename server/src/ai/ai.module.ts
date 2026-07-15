import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { AssistantController } from './assistant/assistant.controller';
import { AssistantService } from './assistant/assistant.service';
import { BudgetService } from './budget/budget.service';
import { GenerationController } from './generation/generation.controller';
import { GenerationPipeline } from './generation/generation.pipeline';
import { GenerationProcessor } from './generation/generation.processor';
import {
  GENERATION_QUEUE,
  GenerationService,
} from './generation/generation.service';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { OllamaProvider } from './llm/ollama.provider';
import { RetrievalService } from './retrieval/retrieval.service';

@Module({
  imports: [QueueModule, BullModule.registerQueue({ name: GENERATION_QUEUE })],
  controllers: [GenerationController, AssistantController],
  providers: [
    { provide: LLM_PROVIDER, useClass: OllamaProvider },
    BudgetService,
    GenerationPipeline,
    GenerationService,
    GenerationProcessor,
    RetrievalService,
    AssistantService,
  ],
  exports: [LLM_PROVIDER, BudgetService, RetrievalService, AssistantService],
})
export class AiModule {}
