import { Module } from '@nestjs/common';
import { AdminModule } from '../../admin/admin.module';
import { StructuredLogger } from '../../common/logger';
import {
  MARKET_PRICE_CACHE_REPOSITORY,
  type MarketPriceCacheRepository,
} from './application/ports/market-price-cache.repository';
import {
  MARKET_PRICE_GATEWAY,
  type MarketPriceGateway,
} from './application/ports/market-price.gateway';
import { GetMarketPriceUseCase } from './application/use-cases/get-market-price.use-case';
import { CepeaMarketPriceGateway } from './infrastructure/cepea-market-price.gateway';
import { PrismaMarketPriceCacheRepository } from './infrastructure/prisma-market-price-cache.repository';

@Module({
  imports: [AdminModule],
  providers: [
    StructuredLogger,
    PrismaMarketPriceCacheRepository,
    {
      provide: CepeaMarketPriceGateway,
      useFactory: () => new CepeaMarketPriceGateway(),
    },
    {
      provide: MARKET_PRICE_CACHE_REPOSITORY,
      useExisting: PrismaMarketPriceCacheRepository,
    },
    { provide: MARKET_PRICE_GATEWAY, useExisting: CepeaMarketPriceGateway },
    {
      provide: GetMarketPriceUseCase,
      useFactory: (
        gateway: MarketPriceGateway,
        cache: MarketPriceCacheRepository,
        logger: StructuredLogger,
      ) => new GetMarketPriceUseCase(gateway, cache, logger),
      inject: [
        MARKET_PRICE_GATEWAY,
        MARKET_PRICE_CACHE_REPOSITORY,
        StructuredLogger,
      ],
    },
  ],
  exports: [GetMarketPriceUseCase],
})
export class MarketPriceModule {}
