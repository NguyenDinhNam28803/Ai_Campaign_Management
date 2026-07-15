import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImportMetricsDto } from './dto/import-metrics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async importMetrics(dto: ImportMetricsDto) {
    let imported = 0;
    let skipped = 0;

    for (const row of dto.rows) {
      const pub = await this.prisma.publication.findUnique({
        where: { id: row.publicationId },
      });
      if (!pub) {
        skipped++;
        continue;
      }

      await this.prisma.metricSnapshot.create({
        data: {
          productLineId: pub.productLineId,
          publicationId: row.publicationId,
          source: dto.source,
          pageviews: row.pageviews,
          uniqueVisitors: row.uniqueVisitors,
          engagements: row.engagements,
          conversions: row.conversions,
          rawMetrics: (row.rawMetrics as Prisma.InputJsonValue) ?? undefined,
          capturedAt: new Date(row.capturedAt),
        },
      });
      imported++;
    }

    return { imported, skipped };
  }

  async getOverview(productLineId: string, from?: string, to?: string) {
    const where: Prisma.MetricSnapshotWhereInput = {
      productLineId,
      ...(from ? { capturedAt: { gte: new Date(from) } } : {}),
      ...(to ? { capturedAt: { lte: new Date(to) } } : {}),
    };

    const aggregates = await this.prisma.metricSnapshot.aggregate({
      where,
      _sum: {
        pageviews: true,
        uniqueVisitors: true,
        engagements: true,
        conversions: true,
      },
    });

    const totalPageviews = aggregates._sum.pageviews ?? 0;
    const totalEngagements = aggregates._sum.engagements ?? 0;

    const topContent = await this.prisma.metricSnapshot.groupBy({
      by: ['publicationId'],
      where,
      _sum: { pageviews: true },
      orderBy: { _sum: { pageviews: 'desc' } },
      take: 5,
    });

    const topContentWithDetails = await Promise.all(
      topContent.map(async (tc) => {
        const pub = await this.prisma.publication.findUnique({
          where: { id: tc.publicationId },
          include: { piece: { select: { title: true } } },
        });
        return {
          pieceId: pub?.pieceId ?? '',
          title: pub?.piece?.title ?? 'Unknown',
          pageviews: tc._sum.pageviews ?? 0,
        };
      }),
    );

    return {
      totalPageviews,
      totalUniqueVisitors: aggregates._sum.uniqueVisitors ?? 0,
      totalEngagements,
      totalConversions: aggregates._sum.conversions ?? 0,
      engagementRate: totalPageviews > 0 ? totalEngagements / totalPageviews : 0,
      topContent: topContentWithDetails,
    };
  }

  async getTimeline(
    productLineId: string,
    period: 'day' | 'week' | 'month' = 'day',
    from?: string,
    to?: string,
  ) {
    const where: Prisma.MetricSnapshotWhereInput = {
      productLineId,
      ...(from ? { capturedAt: { gte: new Date(from) } } : {}),
      ...(to ? { capturedAt: { lte: new Date(to) } } : {}),
    };

    const snapshots = await this.prisma.metricSnapshot.findMany({
      where,
      orderBy: { capturedAt: 'asc' },
      select: {
        capturedAt: true,
        pageviews: true,
        uniqueVisitors: true,
        engagements: true,
      },
    });

    const grouped = new Map<string, { pageviews: number; uniqueVisitors: number; engagements: number }>();

    for (const s of snapshots) {
      const key = this.truncateDate(s.capturedAt, period);
      const existing = grouped.get(key) ?? { pageviews: 0, uniqueVisitors: 0, engagements: 0 };
      grouped.set(key, {
        pageviews: existing.pageviews + s.pageviews,
        uniqueVisitors: existing.uniqueVisitors + s.uniqueVisitors,
        engagements: existing.engagements + s.engagements,
      });
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private truncateDate(date: Date, period: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    if (period === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (period === 'week') {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d.toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  }

  async getChannelBreakdown(productLineId: string, from?: string, to?: string) {
    const where: Prisma.MetricSnapshotWhereInput = {
      productLineId,
      ...(from ? { capturedAt: { gte: new Date(from) } } : {}),
      ...(to ? { capturedAt: { lte: new Date(to) } } : {}),
    };

    const snapshots = await this.prisma.metricSnapshot.findMany({
      where,
      include: {
        publication: {
          include: { channel: { select: { id: true, type: true, name: true } } },
        },
      },
    });

    const channelMap = new Map<
      string,
      { channelType: string; channelName: string; publications: Set<string>; totalPageviews: number; totalEngagements: number }
    >();

    for (const s of snapshots) {
      const ch = s.publication.channel;
      if (!ch) continue;
      const existing = channelMap.get(ch.id) ?? {
        channelType: ch.type,
        channelName: ch.name,
        publications: new Set(),
        totalPageviews: 0,
        totalEngagements: 0,
      };
      existing.publications.add(s.publicationId);
      existing.totalPageviews += s.pageviews;
      existing.totalEngagements += s.engagements;
      channelMap.set(ch.id, existing);
    }

    return Array.from(channelMap.values()).map((ch) => ({
      channelType: ch.channelType,
      channelName: ch.channelName,
      publications: ch.publications.size,
      totalPageviews: ch.totalPageviews,
      totalEngagements: ch.totalEngagements,
    }));
  }

  async getContentPerformance(productLineId: string, from?: string, to?: string) {
    const where: Prisma.MetricSnapshotWhereInput = {
      productLineId,
      ...(from ? { capturedAt: { gte: new Date(from) } } : {}),
      ...(to ? { capturedAt: { lte: new Date(to) } } : {}),
    };

    const metricGroups = await this.prisma.metricSnapshot.groupBy({
      by: ['publicationId'],
      where,
      _sum: { pageviews: true, engagements: true },
      _count: true,
    });

    const results = await Promise.all(
      metricGroups.map(async (mg) => {
        const pub = await this.prisma.publication.findUnique({
          where: { id: mg.publicationId },
          include: { piece: { select: { id: true, title: true, contentType: true, status: true } } },
        });
        if (!pub) return null;

        const aiCost = await this.prisma.aIGeneration.aggregate({
          where: { pieceId: pub.pieceId, status: 'DONE' },
          _sum: { costUsd: true },
        });

        return {
          pieceId: pub.piece.id,
          title: pub.piece.title,
          contentType: pub.piece.contentType,
          status: pub.piece.status,
          publications: mg._count,
          totalPageviews: mg._sum.pageviews ?? 0,
          totalEngagements: mg._sum.engagements ?? 0,
          aiCostUsd: Number(aiCost._sum.costUsd ?? 0),
        };
      }),
    );

    return results.filter(Boolean);
  }

  async getAiCostOverview(productLineId?: string, from?: string, to?: string) {
    const where: Prisma.AIGenerationWhereInput = {
      status: 'DONE',
      ...(productLineId ? { productLineId } : {}),
      ...(from ? { createdAt: { gte: new Date(from) } } : {}),
      ...(to ? { createdAt: { lte: new Date(to) } } : {}),
    };

    const aggregates = await this.prisma.aIGeneration.aggregate({
      where,
      _sum: { costUsd: true },
      _count: true,
    });

    const byMode = await this.prisma.aIGeneration.groupBy({
      by: ['mode'],
      where,
      _sum: { costUsd: true },
    });

    const byModel = await this.prisma.aIGeneration.groupBy({
      by: ['model'],
      where,
      _sum: { costUsd: true },
    });

    const totalCost = Number(aggregates._sum.costUsd ?? 0);
    const count = aggregates._count;

    return {
      totalCostUsd: totalCost,
      costByMode: Object.fromEntries(
        byMode.map((m) => [m.mode, Number(m._sum.costUsd ?? 0)]),
      ),
      costByModel: Object.fromEntries(
        byModel.map((m) => [m.model, Number(m._sum.costUsd ?? 0)]),
      ),
      generationsCount: count,
      avgCostPerGeneration: count > 0 ? totalCost / count : 0,
    };
  }
}
