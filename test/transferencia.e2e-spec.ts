// test/transferencia.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { TenantContext } from './../src/tenant/tenant.context';
import { RequestContext } from './../src/common/context/request-context';
import { TenantPrismaService } from './../src/tenant/tenant-prisma.service';

describe('Transferencia de Animais (e2e)', () => {
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
    
    const client = prisma.getClientForSchema('public');
    
    // Clean up
    await client.transferenciaAnimal.deleteMany({});
    await client.animal.deleteMany({});
    await client.lote.deleteMany({});
    await client.pasto.deleteMany({});
    await client.raca.deleteMany({});
    await client.fazenda.deleteMany({});
    
    // Create Fazendas
    await client.fazenda.create({ data: { id: 201, nome: 'Matriz', ativo: true }});
    await client.fazenda.create({ data: { id: 202, nome: 'Filha 1', ativo: true }});
    await client.fazenda.create({ data: { id: 203, nome: 'Filha 2 (Sem acesso)', ativo: true }});
    
    // Create base records
    await client.raca.create({ data: { id: 201, descricao: 'Nelore' } });
    await client.lote.create({ data: { id: 201, fazendaId: 201, descricao: 'Lote Matriz' } });
    await client.lote.create({ data: { id: 202, fazendaId: 202, descricao: 'Lote Filha' } });
    await client.pasto.create({ data: { id: 201, fazendaId: 201, descricao: 'Pasto Matriz' } });
    await client.pasto.create({ data: { id: 202, fazendaId: 202, descricao: 'Pasto Filha' } });
    
    // Create Animal in Matriz
    await client.animal.create({ 
      data: { 
        id: 201, 
        fazendaId: 201, 
        loteId: 201, 
        pastoId: 201, 
        racaId: 201, 
        numeroBrinco: 'MAT-1', 
        status: 'ATIVO', 
        dataEntrada: new Date() 
      }
    });
  });

  afterAll(async () => {
    const client = prisma.getClientForSchema('public');
    await client.transferenciaAnimal.deleteMany({});
    await client.animal.deleteMany({});
    await client.lote.deleteMany({});
    await client.pasto.deleteMany({});
    await client.raca.deleteMany({});
    await client.fazenda.deleteMany({});

    await client.$disconnect();
    await app.close();
  });

  it('should block transfer to a farm the user does not have access to', async () => {
    let error: any;
    
    await RequestContext.run({ fazendaId: 201, accessibleFazendaIds: [201, 202] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const service = app.get(require('./../src/animais/animais.service').AnimaisService);
        try {
            await service.transferir(201, {
                fazendaDestinoId: 203, // Not accessible
                pastoDestinoId: 202,
                loteDestinoId: 202,
                observacao: 'Transferencia indevida'
            });
        } catch (e) {
            error = e;
        }
      });
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('Você não tem acesso à fazenda de destino.');
  });

  it('should successfully transfer animal to an accessible farm and log in TransferenciaAnimal', async () => {
    let result: any;
    
    await RequestContext.run({ fazendaId: 201, accessibleFazendaIds: [201, 202] }, async () => {
      await TenantContext.run({ tenantId: '1', schemaName: 'public', status: 'ATIVO', organizacaoId: '1' }, async () => {
        const service = app.get(require('./../src/animais/animais.service').AnimaisService);
        result = await service.transferir(201, {
            fazendaDestinoId: 202, // Accessible
            pastoDestinoId: 202,
            loteDestinoId: 202,
            observacao: 'Transferencia OK'
        });
      });
    });

    expect(result).toBeDefined();
    expect(result.fazendaId).toBe(202);
    expect(result.pastoId).toBe(202);
    expect(result.loteId).toBe(202);

    // Verify DB log
    const client = prisma.getClientForSchema('public');
    const logs = await client.transferenciaAnimal.findMany({
      where: { animalId: 201 }
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].fazendaOrigemId).toBe(201);
    expect(logs[0].fazendaDestinoId).toBe(202);
    expect(logs[0].pastoDestinoId).toBe(202);
    expect(logs[0].loteDestinoId).toBe(202);
    expect(logs[0].observacao).toBe('Transferencia OK');
  });
});
