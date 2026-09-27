import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import { PrismaDashboardRepository } from './prisma-dashboard.repository';

describe('PrismaDashboardRepository', () => {
  it('loads only active animals and active measurements from the selected farm', async () => {
    const findAnimals = jest.fn().mockResolvedValue([]);
    const findWeights = jest.fn().mockResolvedValue([]);
    const repository = new PrismaDashboardRepository({
      getClient: () => ({
        animal: { findMany: findAnimals },
        pesagem: { findMany: findWeights },
      }),
    } as unknown as TenantPrismaService);

    await expect(repository.load(10)).resolves.toEqual({
      animals: [],
      measurements: [],
    });
    expect(findAnimals).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fazendaId: 10, ativo: true } }),
    );
    expect(findWeights).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fazendaId: 10,
          ativa: true,
          animal: { ativo: true },
        },
      }),
    );
  });
});
