import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { KnowledgeController } from './knowledge.controller';
import { IngestionProcessor } from './ingestion.processor';
import { INGESTION_QUEUE, KnowledgeService } from './knowledge.service';

@Module({
  imports: [
    AiModule, // để dùng LLM_PROVIDER (embed)
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, IngestionProcessor],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
