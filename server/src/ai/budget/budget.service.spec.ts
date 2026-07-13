import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BudgetService } from './budget.service';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: { organization: { findFirstOrThrow: jest.Mock } };

  const orgWith = (spend: number, budget: number) => ({
    aiSpendPeriodUsd: spend,
    monthlyAiBudgetUsd: budget,
  });

  beforeEach(() => {
    prisma = { organization: { findFirstOrThrow: jest.fn() } };
    service = new BudgetService(prisma as unknown as PrismaService);
  });

  it('cho qua khi còn ngân sách', async () => {
    prisma.organization.findFirstOrThrow.mockResolvedValue(orgWith(2, 10));
    await expect(service.assertWithinBudget()).resolves.toBeUndefined();
  });

  it('chặn khi chi tiêu = ngân sách', async () => {
    prisma.organization.findFirstOrThrow.mockResolvedValue(orgWith(10, 10));
    await expect(service.assertWithinBudget()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('chặn khi vượt ngân sách', async () => {
    prisma.organization.findFirstOrThrow.mockResolvedValue(orgWith(12, 10));
    await expect(service.assertWithinBudget()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('chặn khi ngân sách = 0 (chưa cấp phép)', async () => {
    prisma.organization.findFirstOrThrow.mockResolvedValue(orgWith(0, 0));
    await expect(service.assertWithinBudget()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
