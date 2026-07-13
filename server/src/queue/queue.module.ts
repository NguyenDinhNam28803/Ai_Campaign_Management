import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import redisConfig from '../config/redis.config';

/**
 * Kết nối Redis dùng chung cho BullMQ. forRoot chỉ gọi 1 lần ở đây;
 * các module (ai, knowledge) chỉ cần BullModule.registerQueue.
 */
@Global()
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
  ],
  exports: [BullModule],
})
export class QueueModule {}
