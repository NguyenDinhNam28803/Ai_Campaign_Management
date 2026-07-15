export interface PublishResult {
  externalId: string;
  externalUrl: string;
}

export interface ChannelAdapter {
  publish(
    config: Record<string, unknown>,
    credentials: string,
    content: { title: string; body: string; contentType: string },
  ): Promise<PublishResult>;
}
