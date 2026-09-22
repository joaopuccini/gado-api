import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import { PrismaFarmRepository } from './prisma-farm.repository';

const persistedFarm = {
  id: 20,
  nome: 'Fazenda Sul',
  parentId: 10,
  ativo: true,
};

describe('PrismaFarmRepository', () => {
  it('maps accessible active farms without leaking physical field names', async () => {
    const findMany = jest.fn().mockResolvedValue([persistedFarm]);
    const tenantPrisma = {
      getClient: () => ({ fazenda: { findMany } }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaFarmRepository(tenantPrisma);

    await expect(repository.listAccessible([10, 20])).resolves.toEqual([
      { id: 20, name: 'Fazenda Sul', parentId: 10, active: true },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 20] }, ativo: true },
      orderBy: [{ parentId: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, parentId: true, ativo: true },
    });
  });

  it('creates the farm and owner membership in one transaction', async () => {
    const createFarm = jest.fn().mockResolvedValue(persistedFarm);
    const createMembership = jest.fn().mockResolvedValue({ id: 99 });
    const transactionClient = {
      fazenda: { create: createFarm },
      usuarioFazenda: { create: createMembership },
    };
    const transaction = jest
      .fn()
      .mockImplementation(
        (work: (client: typeof transactionClient) => unknown) =>
          Promise.resolve(work(transactionClient)),
      );
    const tenantPrisma = {
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaFarmRepository(tenantPrisma);

    await expect(
      repository.create({
        name: 'Fazenda Sul',
        parentId: 10,
        ownerLocalUserId: 7,
      }),
    ).resolves.toEqual({
      id: 20,
      name: 'Fazenda Sul',
      parentId: 10,
      active: true,
    });
    expect(createFarm).toHaveBeenCalledWith({
      data: { nome: 'Fazenda Sul', parentId: 10, ativo: true },
      select: { id: true, nome: true, parentId: true, ativo: true },
    });
    expect(createMembership).toHaveBeenCalledWith({
      data: { usuarioId: 7, fazendaId: 20, role: 'DONO', ativo: true },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('reloads active persisted membership and permissions for session selection', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      fazendaId: 20,
      role: 'GESTOR',
      fazenda: { ativo: true },
      usuario: {
        perfil: {
          permissoes: [{ permissao: { codigo: 'farms:read', ativo: true } }],
        },
        permissoes: [
          { ativo: true, permissao: { codigo: 'team:read', ativo: true } },
          { ativo: false, permissao: { codigo: 'ignored', ativo: true } },
        ],
      },
    });
    const tenantPrisma = {
      getClient: () => ({ usuarioFazenda: { findFirst } }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaFarmRepository(tenantPrisma);

    const access = await repository.findActiveAccess(7, 20);

    expect(access).toMatchObject({ farmId: 20, role: 'GESTOR' });
    expect(access?.permissions).toEqual(
      expect.arrayContaining(['farms:read', 'team:read']),
    );
    expect(access?.permissions).not.toContain('ignored');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: 7, fazendaId: 20, ativo: true },
      }),
    );
  });
});
