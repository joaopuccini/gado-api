import { Prisma } from '@prisma/client';
import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import { PrismaPastureRepository } from './prisma-pasture.repository';

const row = {
  id: 3,
  fazendaId: 10,
  descricao: 'Pasto Norte',
  geojson: {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-51.2, -22.1],
          [-51.1, -22.1],
          [-51.1, -22.2],
          [-51.2, -22.1],
        ],
      ],
    },
  },
  tamanhoHectares: new Prisma.Decimal('12.500'),
  ativo: true,
};

describe('PrismaPastureRepository', () => {
  it('scopes paginated reads to the selected farm', async () => {
    const findMany = jest.fn().mockResolvedValue([row]);
    const count = jest.fn().mockResolvedValue(1);
    const repository = new PrismaPastureRepository({
      getClient: () => ({ pasto: { findMany, count } }),
    } as unknown as TenantPrismaService);

    await expect(
      repository.list(10, { page: 2, limit: 5 }),
    ).resolves.toMatchObject({
      data: [
        {
          id: 3,
          farmId: 10,
          description: 'Pasto Norte',
          areaHectares: '12.500',
        },
      ],
      total: 1,
      page: 2,
      limit: 5,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fazendaId: 10, ativo: true },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('checks animals and both movement directions under the farm scope', async () => {
    const animalFind = jest.fn().mockResolvedValue({ id: 7 });
    const movementFind = jest.fn().mockResolvedValue({ id: 8 });
    const repository = new PrismaPastureRepository({
      getClient: () => ({
        animal: { findFirst: animalFind },
        movimentoPasto: { findFirst: movementFind },
      }),
    } as unknown as TenantPrismaService);

    await expect(repository.hasActiveAnimals(3, 10)).resolves.toBe(true);
    await expect(repository.hasMovementHistory(3, 10)).resolves.toBe(true);
    expect(animalFind).toHaveBeenCalledWith({
      where: { pastoId: 3, fazendaId: 10, ativo: true },
      select: { id: true },
    });
    expect(movementFind).toHaveBeenCalledWith({
      where: {
        fazendaId: 10,
        OR: [{ pastoOrigemId: 3 }, { pastoDestinoId: 3 }],
      },
      select: { id: true },
    });
  });

  it('soft-deactivates only an active pasture from the selected farm', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirst = jest.fn().mockResolvedValue({ ...row, ativo: false });
    const repository = new PrismaPastureRepository({
      getClient: () => ({ pasto: { updateMany, findFirst } }),
    } as unknown as TenantPrismaService);

    await expect(repository.deactivate(3, 10)).resolves.toMatchObject({
      id: 3,
      active: false,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 3, fazendaId: 10, ativo: true },
      data: { ativo: false },
    });
  });
});
