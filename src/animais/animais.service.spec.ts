import { Test, TestingModule } from '@nestjs/testing';
import { AnimaisService } from './animais.service';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';

describe('AnimaisService', () => {
  let service: AnimaisService;
  let tenantPrismaService: jest.Mocked<TenantPrismaService>;

  const mockPrismaClient = {
    animal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    fazenda: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    raca: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    lote: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    pasto: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    pesagem: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimaisService,
        {
          provide: TenantPrismaService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockPrismaClient),
            getClientForSchema: jest.fn().mockReturnValue(mockPrismaClient),
          },
        },
      ],
    }).compile();

    service = module.get<AnimaisService>(AnimaisService);
    tenantPrismaService = module.get(TenantPrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service instanceof BaseTenantService).toBeTruthy();
  });

  describe('findAll', () => {
    it('should include related entities (lote, raca, pasto, cliente) by default', async () => {
      const mockAnimals = [{ id: 1, nome: 'Mimosa' }];
      mockPrismaClient.animal.findMany.mockResolvedValue(mockAnimals);
      mockPrismaClient.animal.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(mockPrismaClient.animal.findMany).toHaveBeenCalledWith({
        include: {
          lote: true,
          raca: true,
          pasto: true,
          cliente: true,
        },
        where: { ativo: true },
        orderBy: { id: 'asc' },
        skip: undefined,
        take: undefined,
      });
      expect(result).toEqual({ data: mockAnimals, total: 1 });
    });
  });

  describe('findOne', () => {
    it('should include complete details and recent weighings', async () => {
      const mockAnimal = { id: 1, nome: 'Boiadeiro' };
      mockPrismaClient.animal.findFirst.mockResolvedValue(mockAnimal);

      const result = await service.findOne(1);

      expect(mockPrismaClient.animal.findFirst).toHaveBeenCalledWith({
        where: { id: 1, ativo: true },
        include: {
          lote: true,
          raca: true,
          pasto: true,
          cliente: true,
          vacinacoes: true,
          fotos: true,
          pesagens: { orderBy: { dataPesagem: 'desc' }, take: 5 },
        },
      });
      expect(result).toEqual(mockAnimal);
    });
  });

  describe('seed', () => {
    it('should create required relations if they do not exist and seed 25 animals', async () => {
      mockPrismaClient.fazenda.findFirst.mockResolvedValue(null);
      mockPrismaClient.fazenda.create.mockResolvedValue({ id: 10 });
      
      mockPrismaClient.raca.findFirst.mockResolvedValue(null);
      mockPrismaClient.raca.create.mockResolvedValue({ id: 20 });
      
      mockPrismaClient.lote.findFirst.mockResolvedValue(null);
      mockPrismaClient.lote.create.mockResolvedValue({ id: 30 });
      
      mockPrismaClient.pasto.findFirst.mockResolvedValue(null);
      mockPrismaClient.pasto.create.mockResolvedValue({ id: 40 });

      mockPrismaClient.animal.findMany.mockResolvedValue([
        { id: 100, pesoAtual: 450 },
        { id: 101, pesoAtual: 460 },
      ]);

      const result = await service.seed();

      expect(mockPrismaClient.fazenda.create).toHaveBeenCalled();
      expect(mockPrismaClient.raca.create).toHaveBeenCalled();
      expect(mockPrismaClient.lote.create).toHaveBeenCalled();
      expect(mockPrismaClient.pasto.create).toHaveBeenCalled();
      
      expect(mockPrismaClient.animal.createMany).toHaveBeenCalled();
      const createManyCallArgs = mockPrismaClient.animal.createMany.mock.calls[0][0];
      expect(createManyCallArgs.data).toHaveLength(25);
      
      expect(mockPrismaClient.pesagem.createMany).toHaveBeenCalled();
      
      expect(result).toEqual({ message: '25 animais gerados com sucesso' });
    });
  });
});
