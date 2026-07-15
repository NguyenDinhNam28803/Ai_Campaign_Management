import { NotFoundException } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import type { AssistantDto } from './dto/assistant.dto';

function mockPrisma() {
  return {
    contentPiece: {
      findFirst: jest.fn(),
    },
    aIGeneration: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (ops: unknown[]) => {
      for (const op of ops) await op;
    }),
  } as any;
}

function mockBudget() {
  return { assertWithinBudget: jest.fn() } as any;
}

function mockLLM() {
  async function* fakeStream() {
    yield 'Hello ';
    yield 'world';
  }
  return { stream: jest.fn().mockReturnValue(fakeStream()) } as any;
}

function mockConfig() {
  return { get: jest.fn().mockReturnValue('ai-content') } as any;
}

function createMockRes() {
  const chunks: string[] = [];
  return {
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn((data: string) => chunks.push(data)),
    end: jest.fn(),
    _getChunks: () => chunks,
  } as any;
}

describe('AssistantService', () => {
  let service: AssistantService;
  let prisma: ReturnType<typeof mockPrisma>;
  let budget: ReturnType<typeof mockBudget>;
  let llm: ReturnType<typeof mockLLM>;
  let config: ReturnType<typeof mockConfig>;

  beforeEach(() => {
    prisma = mockPrisma();
    budget = mockBudget();
    llm = mockLLM();
    config = mockConfig();
    service = new AssistantService(llm, prisma, budget, config);
  });

  it('throws NotFoundException when piece not found', async () => {
    prisma.contentPiece.findFirst.mockResolvedValue(null);
    const dto: AssistantDto = { mode: 'rewrite', text: 'test', pieceId: 'x' };
    const res = createMockRes();

    await service.streamRaw(dto, res);

    const written = res._getChunks().join('');
    expect(written).toContain('error');
    expect(written).toContain('Không tìm thấy nội dung');
  });

  it('writes SSE chunks then done', async () => {
    prisma.contentPiece.findFirst.mockResolvedValue({
      id: 'p1',
      productLineId: 'pl1',
    });
    prisma.aIGeneration.create.mockResolvedValue({ id: 'g1' });

    const dto: AssistantDto = { mode: 'rewrite', text: 'Hello world', pieceId: 'p1' };
    const res = createMockRes();

    await service.streamRaw(dto, res);

    const written = res._getChunks().join('');
    expect(written).toContain('data: ');
    expect(written).toContain('"done":false');
    expect(written).toContain('"done":true');
    expect(written).toContain('"generationId":"g1"');
    expect(prisma.aIGeneration.create).toHaveBeenCalled();
  });

  it('uses model from config', async () => {
    config.get.mockReturnValue('qwen2.5:7b');
    const serviceWithConfig = new AssistantService(llm, prisma, budget, config);

    prisma.contentPiece.findFirst.mockResolvedValue({
      id: 'p1',
      productLineId: 'pl1',
    });
    prisma.aIGeneration.create.mockResolvedValue({ id: 'g1' });

    const dto: AssistantDto = { mode: 'rewrite', text: 'test', pieceId: 'p1' };
    const res = createMockRes();

    await serviceWithConfig.streamRaw(dto, res);

    expect(prisma.aIGeneration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ model: 'qwen2.5:7b' }),
      }),
    );
  });
});
