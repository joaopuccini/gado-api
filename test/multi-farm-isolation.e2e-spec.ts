// test/multi-farm-isolation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { TenantContext } from './../src/tenant/tenant.context';
import { RequestContext } from './../src/common/context/request-context';
import { TenantPrismaService } from './../src/tenant/tenant-prisma.service';

describe('Multi-Farm Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: TenantPrismaService;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<TenantPrismaService>(TenantPrismaService);
    await app.init();
    
    // Seed test data directly via default client (public schema for test)
    const client = prisma.getClientForSchema('public');
    
    // Clean up using deleteMany to avoid foreign key issues
    await client.animal.deleteMany({});
    await client.lote.deleteMany({});
    await client.pasto.deleteMany({});
    await client.raca.deleteMany({});
    await client.fazenda.deleteMany({});
    
    // Create two fazendas
    const fazendaA = await client.fazenda.create({ data: { id: 101, nome: 'Fazenda A', ativo: true }});
    const fazendaB = await client.fazenda.create({ data: { id: 102, nome: 'Fazenda B', ativo: true }});
    
    // Create raca, lote, pasto for dummy data
    const raca = await client.raca.create({ data: { id: 101, descricao: 'Nelore' } });
    const loteA = await client.lote.create({ data: { id: 101, fazendaId: 101, descricao: 'Lote A' } });
    const loteB = await client.lote.create({ data: { id: 102, fazendaId: 102, descricao: 'Lote B' } });
    const pastoA = await client.pasto.create({ data: { id: 101, fazendaId: 101, descricao: 'Pasto A' } });
    const pastoB = await client.pasto.create({ data: { id: 102, fazendaId: 102, descricao: 'Pasto B' } });
    
    // Create Animals for Fazenda A
    await client.animal.create({ data: { id: 101, fazendaId: 101, loteId: 101, pastoId: 101, racaId: 101, numeroBrinco: 'A1', status: 'ATIVO', dataEntrada: new Date() }});
    // Create Animals for Fazenda B
    await client.animal.create({ data: { id: 102, fazendaId: 102, loteId: 102, pastoId: 102, racaId: 101, numeroBrinco: 'B1', status: 'ATIVO', dataEntrada: new Date() }});
    
    const count = await client.animal.count();
    console.log(`Animals created in DB: ${count}`);
  });

  afterAll(async () => {
    // Clean up using deleteMany to avoid foreign key issues
    const client = prisma.getClientForSchema('public');
    await client.animal.deleteMany({});
    await client.lote.deleteMany({});
    await client.pasto.deleteMany({});
    await client.raca.deleteMany({});
    await client.fazenda.deleteMany({});

    await client.$disconnect();
    await app.close();
  });

  it('should only return animals for the fazendaId in RequestContext', async () => {
    let animals: any[] = [];
    
    // Simulate middleware context setup
    await RequestContext.run({ fazendaId: 101 }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const client = prisma.getClient();
        animals = await client.animal.findMany();
      });
    });

    expect(animals).toHaveLength(1);
    expect(animals[0].fazendaId).toBe(101);
    expect(animals[0].numeroBrinco).toBe('A1');
  });

  it('should return animals for all accessible farms when logged in as Matriz', async () => {
    let animals: any[] = [];
    
    // Simulate middleware context setup for Matriz (which has access to 101 and 102)
    // The interceptor would set accessibleFazendaIds to [100, 101, 102]
    await RequestContext.run({ fazendaId: 100, accessibleFazendaIds: [100, 101, 102] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const client = prisma.getClient();
        animals = await client.animal.findMany();
      });
    });

    // We only created animals in 101 and 102, so length should be 2
    expect(animals).toHaveLength(2);
    expect(animals.map(a => a.fazendaId).sort()).toEqual([101, 102]);
  });
  
  it('should convert findUnique to findFirst to respect accessibleFazendaIds', async () => {
    let animal: any = null;
    
    await RequestContext.run({ fazendaId: 100, accessibleFazendaIds: [100, 101, 102] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const client = prisma.getClient();
        animal = await client.animal.findUnique({
          where: { id: 101 }
        });
      });
    });

    expect(animal).toBeDefined();
    expect(animal.fazendaId).toBe(101);
  });
  
  it('should fail to findUnique a record that belongs to an inaccessible farm', async () => {
    let animal: any = null;
    
    // User is on farm 101, they only have access to 101
    await RequestContext.run({ fazendaId: 101, accessibleFazendaIds: [101] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const client = prisma.getClient();
        animal = await client.animal.findUnique({
          where: { id: 102 } // This animal is in farm 102
        });
      });
    });

    expect(animal).toBeNull();
  });

  it('should create an animal in a specified accessible child farm', async () => {
    let newAnimal: any = null;
    
    await RequestContext.run({ fazendaId: 100, accessibleFazendaIds: [100, 101, 102] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const client = prisma.getClient();
        newAnimal = await client.animal.create({
          data: {
            id: 103,
            fazendaId: 102, // User explicitly specifies farm 102
            loteId: 102,
            pastoId: 102,
            racaId: 101,
            numeroBrinco: 'C1',
            status: 'ATIVO',
            dataEntrada: new Date()
          }
        });
      });
    });

    expect(newAnimal).toBeDefined();
    expect(newAnimal.fazendaId).toBe(102);
  });
});
