import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from '../queue/queue.module';
import { ChannelModule } from '../channel/channel.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicationController } from './publish.controller';
import { PublishService } from './publish.service';
import { OutboxProcessor, OUTBOX_QUEUE } from './outbox.processor';
import { WordPressAdapter } from './adapters/wordpress.adapter';
import { StubAdapter } from './adapters/stub.adapter';
import {
  WORDPRESS_ADAPTER,
  STUB_ADAPTER,
} from './adapters/adapter.tokens';

@Module({
  imports: [
    QueueModule,
    BullModule.registerQueue({ name: OUTBOX_QUEUE }),
    ChannelModule,
    PrismaModule,
  ],
  controllers: [PublicationController],
  providers: [
    PublishService,
    OutboxProcessor,
    { provide: WORDPRESS_ADAPTER, useClass: WordPressAdapter },
    { provide: STUB_ADAPTER, useClass: StubAdapter },
  ],
  exports: [PublishService],
})
export class PublishModule {}
