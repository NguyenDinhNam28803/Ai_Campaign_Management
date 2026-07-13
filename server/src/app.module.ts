import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CampaignModule } from './campaign/campaign.module';
import { validate } from './config/env.validation';
import { ContentModule } from './content/content.module';
import { HealthModule } from './health/health.module';
import { OrganizationModule } from './organization/organization.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductLineModule } from './product-line/product-line.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OrganizationModule,
    ProductLineModule,
    CampaignModule,
    ContentModule,
    AiModule,
  ],
  providers: [
    // Thứ tự quan trọng: xác thực JWT trước, rồi mới kiểm tra role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
