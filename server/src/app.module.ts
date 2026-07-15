import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CampaignModule } from './campaign/campaign.module';
import { ChannelModule } from './channel/channel.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import { validate } from './config/env.validation';
import ollamaConfig from './config/ollama.config';
import openaiConfig from './config/openai.config';
import redisConfig from './config/redis.config';
import { ContentModule } from './content/content.module';
import { HealthModule } from './health/health.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { OrganizationModule } from './organization/organization.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductLineModule } from './product-line/product-line.module';
import { PublishModule } from './publish/publish.module';
import { QueueModule } from './queue/queue.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [appConfig, authConfig, redisConfig, openaiConfig, ollamaConfig],
    }),
    QueueModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OrganizationModule,
    ProductLineModule,
    CampaignModule,
    ContentModule,
    AiModule,
    KnowledgeModule,
    ChannelModule,
    PublishModule,
    AnalyticsModule,
  ],
  providers: [
    // Thứ tự quan trọng: xác thực JWT trước, rồi mới kiểm tra role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
