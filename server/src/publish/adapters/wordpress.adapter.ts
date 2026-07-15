import { Injectable, Logger } from '@nestjs/common';
import type { ChannelAdapter, PublishResult } from './channel.adapter';

@Injectable()
export class WordPressAdapter implements ChannelAdapter {
  private readonly logger = new Logger(WordPressAdapter.name);

  async publish(
    config: Record<string, unknown>,
    credentials: string,
    content: { title: string; body: string; contentType: string },
  ): Promise<PublishResult> {
    const siteUrl = config.siteUrl as string;
    if (!siteUrl) {
      throw new Error('WordPress channel thiếu config.siteUrl');
    }

    const [user, appPassword] = credentials.split(':');
    if (!user || !appPassword) {
      throw new Error(
        'WordPress credentials phải có format "user:application_password"',
      );
    }

    const auth = Buffer.from(`${user}:${appPassword}`).toString('base64');

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        title: content.title,
        content: content.body,
        status: 'publish',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WordPress publish failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as { id: number; link: string };
    this.logger.log(`Published to WordPress: post ${data.id}`);

    return {
      externalId: String(data.id),
      externalUrl: data.link,
    };
  }
}
