import { Injectable, Logger } from '@nestjs/common';
import type { ChannelAdapter, PublishResult } from './channel.adapter';

@Injectable()
export class StubAdapter implements ChannelAdapter {
  private readonly logger = new Logger(StubAdapter.name);

  async publish(
    _config: Record<string, unknown>,
    _credentials: string,
    content: { title: string; body: string },
  ): Promise<PublishResult> {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
    const id = `stub-${Date.now()}`;
    this.logger.log(`[STUB] Published "${content.title}" → ${id}`);
    return {
      externalId: id,
      externalUrl: `https://stub.example.com/${id}`,
    };
  }
}
