import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import { PrismaHerdCatalogRepository } from './prisma-herd-catalog.repository';

describe('PrismaHerdCatalogRepository', () => {
  it('maps active breeds in stable id order with pagination', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 2, descricao: 'Nelore', ativo: true },
    ]);
    const count = jest.fn().mockResolvedValue(1);
    const tenantPrisma = {
      getClient: () => ({ raca: { findMany, count } }),
    } as unknown as TenantPrismaService;

    const repository = new PrismaHerdCatalogRepository(tenantPrisma);

    await expect(repository.listBreeds({ page: 2, limit: 5 })).resolves.toEqual({
      data: [{ id: 2, description: 'Nelore', active: true }],
      page: 2,
      limit: 5,
      total: 1,
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { id: 'asc' },
      skip: 5,
      take: 5,
      select: { id: true, descricao: true, ativo: true },
    });
  });

  it('always scopes batch reads and dependencies to the selected farm', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 3, fazendaId: 10, descricao: 'Recria', ativo: true },
    ]);
    const count = jest.fn().mockResolvedValue(1);
    const findFirstAnimal = jest.fn().mockResolvedValue({ id: 99 });
    const tenantPrisma = {
      getClient: () => ({
        lote: { findMany, count },
        animal: { findFirst: findFirstAnimal },
      }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaHerdCatalogRepository(tenantPrisma);

    await repository.listBatches(10, { page: 1, limit: 20 });
    await expect(repository.hasActiveAnimalsForBatch(3, 10)).resolves.toBe(true);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fazendaId: 10, ativo: true } }),
    );
    expect(findFirstAnimal).toHaveBeenCalledWith({
      where: { loteId: 3, fazendaId: 10, ativo: true },
      select: { id: true },
    });
  });

  it('soft-deactivates a batch only under the selected farm predicate', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirst = jest.fn().mockResolvedValue({
      id: 3,
      fazendaId: 10,
      descricao: 'Recria',
      ativo: false,
    });
    const tenantPrisma = {
      getClient: () => ({ lote: { updateMany, findFirst } }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaHerdCatalogRepository(tenantPrisma);

    await expect(repository.deactivateBatch(3, 10)).resolves.toEqual({
      id: 3,
      farmId: 10,
      description: 'Recria',
      active: false,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 3, fazendaId: 10, ativo: true },
      data: { ativo: false },
    });
  });
});
