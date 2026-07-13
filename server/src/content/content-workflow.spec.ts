import { BadRequestException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { assertTransition, canTransition, TRANSITIONS } from './content-workflow';

describe('content-workflow', () => {
  it('cho phép các bước hợp lệ trong vòng đời', () => {
    expect(canTransition(ContentStatus.DRAFT, ContentStatus.IN_REVIEW)).toBe(true);
    expect(canTransition(ContentStatus.IN_REVIEW, ContentStatus.APPROVED)).toBe(true);
    expect(canTransition(ContentStatus.IN_REVIEW, ContentStatus.DRAFT)).toBe(true);
    expect(canTransition(ContentStatus.APPROVED, ContentStatus.DRAFT)).toBe(true);
    expect(canTransition(ContentStatus.APPROVED, ContentStatus.PUBLISHED)).toBe(true);
    expect(canTransition(ContentStatus.PUBLISHED, ContentStatus.ARCHIVED)).toBe(true);
  });

  it('chặn đường tắt qua khâu duyệt (DRAFT → PUBLISHED)', () => {
    expect(canTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED)).toBe(false);
    expect(canTransition(ContentStatus.DRAFT, ContentStatus.APPROVED)).toBe(false);
  });

  it('ARCHIVED là trạng thái cuối, không đi đâu được', () => {
    expect(TRANSITIONS[ContentStatus.ARCHIVED]).toHaveLength(0);
  });

  it('assertTransition ném BadRequest với bước không hợp lệ', () => {
    expect(() =>
      assertTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED),
    ).toThrow(BadRequestException);
  });

  it('assertTransition không ném với bước hợp lệ', () => {
    expect(() =>
      assertTransition(ContentStatus.DRAFT, ContentStatus.IN_REVIEW),
    ).not.toThrow();
  });
});
