import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chặn ngay tại cổng nếu chi tiêu kỳ này đã chạm/vượt ngân sách tháng.
   * Ngân sách = 0 nghĩa là chưa cấp phép → chặn (phải set budget trước).
   */
  async assertWithinBudget(): Promise<void> {
    const org = await this.prisma.organization.findFirstOrThrow();
    const spend = Number(org.aiSpendPeriodUsd);
    const budget = Number(org.monthlyAiBudgetUsd);
    if (spend >= budget) {
      throw new ForbiddenException(
        `Đã chạm ngân sách AI tháng này (${spend}/${budget} USD)`,
      );
    }
  }
}
