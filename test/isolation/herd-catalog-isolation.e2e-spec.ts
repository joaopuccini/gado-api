import { ExecutionContextStore } from '../../src/common/context';
import type {
  BatchView,
  HerdCatalogRepository,
} from '../../src/herd/catalog/application/ports/herd-catalog.repository';
import { ManageHerdCatalogUseCase } from '../../src/herd/catalog/application/use-cases/manage-herd-catalog.use-case';

const contextFor = (farmId: number) => ({
  requestId: `request-${farmId}`,
  traceId: `trace-${farmId}`,
  contextType: 'tenant' as const,
  startedAt: Date.now(),
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId,
  accessibleFarmIds: [10, 20],
  permissions: ['lotes:ler'],
});

const batchFor = (farmId: number): BatchView => ({
  id: farmId,
  farmId,
  description: `Lote ${farmId}`,
  active: true,
});

describe('herd catalog concurrent isolation', () => {
  it('keeps selected-farm batch queries isolated across interleaved contexts', async () => {
    const observedFarmIds: number[] = [];
    const repository = {
      listBatches: jest.fn(async (farmId: number, request) => {
        await new Promise((resolve) =>
          setTimeout(resolve, farmId === 10 ? 20 : 5),
        );
        observedFarmIds.push(farmId);
        return { data: [batchFor(farmId)], total: 1, ...request };
      }),
    } as unknown as HerdCatalogRepository;
    const context = new ExecutionContextStore();
    const useCase = new ManageHerdCatalogUseCase(repository, context);

    const [farmTen, farmTwenty] = await Promise.all([
      context.run(contextFor(10), () =>
        useCase.listBatches({ page: 1, limit: 20 }),
      ),
      context.run(contextFor(20), () =>
        useCase.listBatches({ page: 1, limit: 20 }),
      ),
    ]);

    expect(farmTen.data).toEqual([batchFor(10)]);
    expect(farmTwenty.data).toEqual([batchFor(20)]);
    expect(observedFarmIds).toEqual([20, 10]);
  });
});
