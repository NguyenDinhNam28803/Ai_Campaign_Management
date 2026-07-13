import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import redisConfig from '../config/redis.config';
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

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: ConfigType<typeof redisConfig>) => {
        const url = new URL(redis.url);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: GENERATION_QUEUE }),
  ],
  controllers: [GenerationController],
  providers: [
    { provide: LLM_PROVIDER, useClass: OpenAIProvider },
    BudgetService,
    GenerationPipeline,
    GenerationService,
    GenerationProcessor,
  ],
  exports: [LLM_PROVIDER, BudgetService],
})
export class AiModule {}
