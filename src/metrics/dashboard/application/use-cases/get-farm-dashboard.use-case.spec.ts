import { ExecutionContextStore } from '../../../../common/context';
import type {
  DashboardRepository,
  DashboardSnapshot,
} from '../ports/dashboard.repository';
import { GetFarmDashboardUseCase } from './get-farm-dashboard.use-case';

const CONTEXT = {
  requestId: 'dashboard-request',
  traceId: 'dashboard-trace',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['dashboard:ler'],
};

const SNAPSHOT: DashboardSnapshot = {
  animals: [
    {
      id: 1,
      batchId: 11,
      batchName: 'Lote A',
      pastureId: 21,
      pastureName: 'Pasto X',
      currentWeight: 420,
    },
    {
      id: 2,
      batchId: 11,
      batchName: 'Lote A',
      pastureId: 22,
      pastureName: 'Pasto Y',
      currentWeight: 480,
    },
    {
      id: 3,
      batchId: 12,
      batchName: 'Lote B',
      pastureId: 21,
      pastureName: 'Pasto X',
      currentWeight: null,
    },
    {
      id: 4,
      batchId: 12,
      batchName: 'Lote B',
      pastureId: 21,
      pastureName: 'Pasto X',
      currentWeight: 300,
    },
  ],
  measurements: [
    {
      id: 1,
      animalId: 1,
      weight: 400,
      measuredAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      animalId: 1,
      weight: 420,
      measuredAt: new Date('2026-01-11T00:00:00.000Z'),
    },
    {
      id: 3,
      animalId: 2,
      weight: 500,
      measuredAt: new Date('2026-09-01T00:00:00.000Z'),
    },
    {
      id: 4,
      animalId: 2,
      weight: 480,
      measuredAt: new Date('2026-09-21T00:00:00.000Z'),
    },
    {
      id: 5,
      animalId: 4,
      weight: 300,
      measuredAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  ],
};

class StubDashboardRepository implements DashboardRepository {
  farmIds: number[] = [];
  load(farmId: number): Promise<DashboardSnapshot> {
    this.farmIds.push(farmId);
    return Promise.resolve(SNAPSHOT);
  }
}

describe('GetFarmDashboardUseCase', () => {
  it('derives persisted indicators, distributions, evolution and alerts', async () => {
    const context = new ExecutionContextStore();
    const repository = new StubDashboardRepository();
    const useCase = new GetFarmDashboardUseCase(
      repository,
      context,
      () => new Date('2026-09-27T12:00:00.000Z'),
    );

    await expect(
      context.run(CONTEXT, () => useCase.execute()),
    ).resolves.toEqual({
      activeAnimals: 4,
      averageWeight: 400,
      averageDailyGain: 0.5,
      monthlyEvolution: [
        { month: '2026-01', averageWeight: 410 },
        { month: '2026-08', averageWeight: 300 },
        { month: '2026-09', averageWeight: 490 },
      ],
      byBatch: [
        { id: 11, name: 'Lote A', animalCount: 2, averageWeight: 450 },
        { id: 12, name: 'Lote B', animalCount: 2, averageWeight: 300 },
      ],
      byPasture: [
        { id: 21, name: 'Pasto X', animalCount: 3, averageWeight: 360 },
        { id: 22, name: 'Pasto Y', animalCount: 1, averageWeight: 480 },
      ],
      alerts: [
        { type: 'STALE_WEIGHT', animalId: 1, lastMeasuredAt: '2026-01-11' },
        { type: 'WEIGHT_LOSS', animalId: 2, lastMeasuredAt: '2026-09-21' },
        { type: 'NO_WEIGHT', animalId: 3, lastMeasuredAt: null },
        { type: 'STALE_WEIGHT', animalId: 4, lastMeasuredAt: '2026-08-01' },
      ],
    });
    expect(repository.farmIds).toEqual([10]);
  });

  it('fails closed before loading data without tenant context', async () => {
    const repository = new StubDashboardRepository();
    const useCase = new GetFarmDashboardUseCase(
      repository,
      new ExecutionContextStore(),
    );
    await expect(useCase.execute()).rejects.toMatchObject({
      code: 'executionContextMissing',
    });
    expect(repository.farmIds).toEqual([]);
  });
});
