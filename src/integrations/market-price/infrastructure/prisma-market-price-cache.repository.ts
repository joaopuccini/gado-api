import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import type {
  MarketPriceCacheEntry,
  MarketPriceCacheRepository,
} from '../application/ports/market-price-cache.repository';

@Injectable()
export class PrismaMarketPriceCacheRepository implements MarketPriceCacheRepository {
  constructor(private readonly prisma: AdminPrismaService) {}

  async find(key: string): Promise<MarketPriceCacheEntry | null> {
    const value = await this.prisma.marketPriceCache.findUnique({
      where: { key },
    });
    return value
      ? {
          key: value.key,
          value: Number(value.value.toString()),
          observedAt: value.observedAt,
          fetchedAt: value.fetchedAt,
        }
      : null;
  }

  async save(entry: MarketPriceCacheEntry): Promise<void> {
    await this.prisma.marketPriceCache.upsert({
      where: { key: entry.key },
      create: entry,
      update: {
        value: entry.value,
        observedAt: entry.observedAt,
        fetchedAt: entry.fetchedAt,
      },
    });
  }
}
