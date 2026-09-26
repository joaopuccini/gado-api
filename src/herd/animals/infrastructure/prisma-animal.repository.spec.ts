import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type { CreateAnimalRecord } from '../application/ports/animal.repository';
import { PrismaAnimalRepository } from './prisma-animal.repository';

const PURCHASE: CreateAnimalRecord = {
  fazendaId: 10,
  registradoPorId: 7,
  loteId: 2,
  racaId: 3,
  pastoId: 4,
  clienteId: 5,
  nome: 'Estrela',
  numeroBrinco: 'BR-001',
  sexo: 'FEMEA',
  status: 'ATIVO',
  tipoEntrada: 'COMPRA_OLHO',
  nascimento: '2024-01-01',
  dataEntrada: '2026-09-26',
  pesoEntrada: 300,
  pesoAtual: 300,
  precoKilo: null,
  valorCompra: 3500,
  valorCustoTotal: 3500,
  matriz: true,
  castrado: false,
  observacao: null,
};

const persistedAnimal = {
  id: 1,
  fazendaId: 10,
  loteId: 2,
  racaId: 3,
  pastoId: 4,
  clienteId: 5,
  nome: 'Estrela',
  numeroBrinco: 'BR-001',
  sexo: 'FEMEA',
  status: 'ATIVO',
  tipoEntrada: 'COMPRA_OLHO',
  nascimento: new Date('2024-01-01T00:00:00.000Z'),
  dataEntrada: new Date('2026-09-26T00:00:00.000Z'),
  pesoEntrada: 300,
  pesoAtual: 300,
  precoKilo: null,
  valorCompra: 3500,
  valorCustoTotal: 3500,
  matriz: true,
  castrado: false,
  observacao: null,
  ativo: true,
};

describe('PrismaAnimalRepository', () => {
  it('creates a purchase and matching cash outflow in one transaction', async () => {
    const createAnimal = jest.fn().mockResolvedValue(persistedAnimal);
    const createCash = jest.fn().mockResolvedValue({ id: 8 });
    const transactionClient = {
      animal: { create: createAnimal },
      caixa: { create: createCash },
    };
    const transaction = jest.fn(
      (work: (client: typeof transactionClient) => Promise<unknown>) =>
        work(transactionClient),
    );
    const tenantPrisma = {
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaAnimalRepository(tenantPrisma);

    await expect(repository.create(PURCHASE)).resolves.toMatchObject({
      id: 1,
      numeroBrinco: 'BR-001',
      valorCompra: 3500,
    });
    expect(createAnimal).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fazendaId: 10,
        loteId: 2,
        numeroBrinco: 'BR-001',
        tipoEntrada: 'COMPRA_OLHO',
        valorCompra: 3500,
      }),
      select: expect.any(Object),
    });
    expect(createCash).toHaveBeenCalledWith({
      data: {
        fazendaId: 10,
        registradoPorId: 7,
        descricao: 'Compra do animal BR-001',
        valor: 3500,
        operacao: 'SAIDA',
        dataOperacao: new Date('2026-09-26T00:00:00.000Z'),
        observacao: 'animalId=1',
        ativo: true,
      },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('translates a farm ear-tag unique violation into a stable conflict', async () => {
    const transaction = jest.fn().mockRejectedValue({
      code: 'P2002',
      meta: { target: ['fazenda_id', 'numero_brinco'] },
    });
    const tenantPrisma = {
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaAnimalRepository(tenantPrisma);

    await expect(repository.create(PURCHASE)).rejects.toMatchObject({
      code: 'earTagAlreadyExists',
    });
  });

  it('validates farm-scoped relations and tenant-wide active breed explicitly', async () => {
    const racaCount = jest.fn().mockResolvedValue(1);
    const loteCount = jest.fn().mockResolvedValue(1);
    const pastoCount = jest.fn().mockResolvedValue(1);
    const clienteCount = jest.fn().mockResolvedValue(1);
    const tenantPrisma = {
      getClient: () => ({
        raca: { count: racaCount },
        lote: { count: loteCount },
        pasto: { count: pastoCount },
        cliente: { count: clienteCount },
      }),
    } as unknown as TenantPrismaService;
    const repository = new PrismaAnimalRepository(tenantPrisma);

    await expect(repository.validateRelations(PURCHASE)).resolves.toBe(true);
    expect(racaCount).toHaveBeenCalledWith({ where: { id: 3, ativo: true } });
    expect(loteCount).toHaveBeenCalledWith({
      where: { id: 2, fazendaId: 10, ativo: true },
    });
    expect(pastoCount).toHaveBeenCalledWith({
      where: { id: 4, fazendaId: 10, ativo: true },
    });
    expect(clienteCount).toHaveBeenCalledWith({
      where: { id: 5, ativo: true },
    });
  });
});
