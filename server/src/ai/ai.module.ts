import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        );
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
