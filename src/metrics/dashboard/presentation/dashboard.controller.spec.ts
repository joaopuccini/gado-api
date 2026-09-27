import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS_KEY } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import type { GetMarketPriceUseCase } from '../../../integrations/market-price/application/use-cases/get-market-price.use-case';
import type { GetFarmDashboardUseCase } from '../application/use-cases/get-farm-dashboard.use-case';
import { FarmDashboardController } from './dashboard.controller';

describe('farm dashboard HTTP boundary', () => {
  it('is authenticated and declares dashboard read permission', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, FarmDashboardController),
    ).toEqual([JwtAuthGuard, PermissionsGuard]);
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        // Metadata is attached to the method function itself by the decorator.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        FarmDashboardController.prototype.summary,
      ),
    ).toEqual(['dashboard:ler']);
  });

  it.each([
    { marketPrice: { value: 327.5, freshness: 'fresh' } },
    { marketPrice: { value: 320, freshness: 'stale' } },
    { marketPrice: null },
  ])(
    'composes persisted metrics with $marketPrice',
    async ({ marketPrice }) => {
      const dashboard = {
        execute: jest.fn().mockResolvedValue({ activeAnimals: 4 }),
      };
      const market = { execute: jest.fn().mockResolvedValue(marketPrice) };
      const controller = new FarmDashboardController(
        dashboard as unknown as GetFarmDashboardUseCase,
        market as unknown as GetMarketPriceUseCase,
      );
      await expect(controller.summary()).resolves.toEqual({
        activeAnimals: 4,
        marketPrice,
      });
    },
  );
});
