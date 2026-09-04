import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { TenantContext } from './tenant.context';
import { RequestContext } from '../common/context/request-context';
interface CachedClient {
  client: PrismaClient;
  lastUsed: number;
  schemaName: string;
}

export let globalTenantPrismaService: TenantPrismaService | null = null;

/**
 * Pool de PrismaClient por tenant com LRU cache.
 * Cada tenant tem seu próprio PrismaClient configurado para o schema correto.
 * Quando não há tenant no contexto (dev mode), retorna client do schema default.
 */
@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaService.name);
  private readonly clients = new Map<string, CachedClient>();
  private readonly MAX_CLIENTS = 50;
  private readonly CLIENT_IDLE_MS = 300_000; // 5 minutos
  private readonly defaultClient: PrismaClient;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    globalTenantPrismaService = this;
    
    // Client default para dev mode (schema public/gado_admin)
    const databaseUrl = process.env.DATABASE_URL || '';
    const pool = new Pool({
      connectionString: databaseUrl,
    });
    
    // Tabelas que sempre resolvem para o schema gado_admin (SaaS global)
    const adminTables = ['admin_users', 'assinaturas', 'organizacoes', 'pagamentos', 'planos', 'tenant_registry'];

    const interceptQuery = (originalQuery: Function, schemaReplacement: string) => {
      return function (...args: any[]) {
        let queryConfig = args[0];
        let text = typeof queryConfig === 'string' ? queryConfig : queryConfig?.text;

        if (text && typeof text === 'string') {
          if (text !== 'BEGIN' && text !== 'COMMIT' && text !== 'ROLLBACK') {
            text = text.replace(/\"public\"\./g, `"${schemaReplacement}".`);
            adminTables.forEach(t => {
              const tenantRegex = new RegExp(`"${schemaReplacement}"\\."${t}"`, 'g');
              text = text.replace(tenantRegex, `"gado_admin"."${t}"`);
            });
          }
        }

        if (typeof queryConfig === 'string') {
          args[0] = text;
        } else if (queryConfig && typeof queryConfig === 'object') {
          queryConfig.text = text;
        }

        try {
          return originalQuery(...args);
        } catch (error: any) {
          throw error;
        }
      };
    };

    // Intercept pool.query
    pool.query = interceptQuery(pool.query.bind(pool), 'public') as any;

    // Intercept client.query for transactions
    pool.on('connect', (client) => {
      client.query = interceptQuery(client.query.bind(client), 'public') as any;
    });

    const adapter = new PrismaPg(pool);
    this.defaultClient = new PrismaClient({ adapter });

    // Cleanup de clientes ociosos a cada 2 minutos
    this.cleanupInterval = setInterval(() => this.evictIdleClients(), 120_000);
    this.cleanupInterval.unref(); // Não impedir shutdown do processo
  }

  /**
   * Retorna o PrismaClient para o tenant atual (via AsyncLocalStorage).
   * Se não houver tenant no contexto, retorna o client default.
   */
  getClient(): PrismaClient {
    const tenant = TenantContext.get();

    if (!tenant) {
      return this.defaultClient;
    }

    return this.getClientForSchema(tenant.schemaName);
  }

  /**
   * Retorna PrismaClient para um schema específico.
   * Cria novo client se não existir no cache.
   */
  getClientForSchema(schemaName: string): PrismaClient {
    const cached = this.clients.get(schemaName);

    if (cached) {
      cached.lastUsed = Date.now();
      return cached.client;
    }

    this.logger.log(`Cache MISS para schema: ${schemaName} - criando novo pool`);

    // Evitar exceder o limite de clientes
    if (this.clients.size >= this.MAX_CLIENTS) {
      this.evictLeastRecentlyUsed();
    }

    const client = this.createClientForSchema(schemaName);
    this.clients.set(schemaName, {
      client,
      lastUsed: Date.now(),
      schemaName,
    });

    return client;
  }

  /**
   * Cria um novo PrismaClient com search_path configurado para o schema do tenant.
   */
  private createClientForSchema(schemaName: string): PrismaClient {
    const databaseUrl = process.env.DATABASE_URL || '';

    const adminTables = ['admin_users', 'assinaturas', 'organizacoes', 'pagamentos', 'planos', 'tenant_registry'];

    const interceptQuery = (originalQuery: Function, schemaReplacement: string) => {
      return function (...args: any[]) {
        let queryConfig = args[0];
        let text = typeof queryConfig === 'string' ? queryConfig : queryConfig?.text;

        if (text && typeof text === 'string') {
          if (text !== 'BEGIN' && text !== 'COMMIT' && text !== 'ROLLBACK') {
            text = text.replace(/\"public\"\./g, `"${schemaReplacement}".`);
            adminTables.forEach(t => {
              const tenantRegex = new RegExp(`"${schemaReplacement}"\\."${t}"`, 'g');
              text = text.replace(tenantRegex, `"gado_admin"."${t}"`);
            });
          }
        }

        if (typeof queryConfig === 'string') {
          args[0] = text;
        } else if (queryConfig && typeof queryConfig === 'object') {
          queryConfig.text = text;
        }
        
        try {
          return originalQuery(...args);
        } catch (error: any) {
          throw error;
        }
      };
    };

    // Utiliza connection options nativas do Postgres para injetar o search_path
    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 5,
    });

    pool.on('connect', (client) => {
      client.query = interceptQuery(client.query.bind(client), schemaName) as any;
    });

    pool.on('error', (err) => {
      this.logger.error(`[Pool: ${schemaName}] Erro no pool: ${err.message}`);
    });

    pool.query = interceptQuery(pool.query.bind(pool), schemaName) as any;

    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter, log: ['query', 'error'] });

    // Injeta Prisma Extension para isolamento de Fazendas
    const extendedClient = client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const modelsWithFazenda = [
              'Animal', 'Lote', 'Pasto', 'Almoxarifado', 'Produto', 'PedidoCompra', 'Safra', 'ContaBancaria', 'ContaPagar', 'ContaReceber', 'Maquina',
              'Custo', 'CustoAnimal', 'Venda', 'ItemVenda', 'Caixa', 'Pesagem', 'Vacinacao', 'Foto', 'ManejoReproducao', 'MovimentoPasto', 'MovimentoLote', 
              'MovimentoEstoque', 'ItemPedidoCompra', 'TransacaoBancaria', 'Abastecimento', 'Manutencao'
            ];
            const fazendaId = RequestContext.getFazendaId();
            const accessibleFazendaIds = RequestContext.getAccessibleFazendaIds() || (fazendaId ? [fazendaId] : []);
            
            console.log(`[Extension] model=${model} operation=${operation} fazendaId=${fazendaId}`);

            const anyArgs = args as any;
            if (fazendaId && modelsWithFazenda.includes(model as string)) {
              if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
              } else if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
                const firstOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
                console.log(`[Extension] converted ${operation} to ${firstOp}, modified args:`, JSON.stringify(anyArgs));
                return (client as any)[model as string][firstOp](anyArgs);
              } else if (['create', 'createMany'].includes(operation)) {
                const enforceFazendaId = (data: any) => {
                  if (data.fazendaId && accessibleFazendaIds.includes(data.fazendaId)) {
                    return data;
                  }
                  return { ...data, fazendaId };
                };
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data = anyArgs.data.map(enforceFazendaId);
                } else {
                  anyArgs.data = enforceFazendaId(anyArgs.data);
                }
              } else if (['update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
              }
              console.log(`[Extension] modified args:`, JSON.stringify(anyArgs));
            }

            return query(anyArgs);
          },
        },
      },
    }) as unknown as PrismaClient;

    return extendedClient;
  }

  /**
   * Remove o client menos recentemente usado do cache.
   */
  private evictLeastRecentlyUsed(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.clients.entries()) {
      if (value.lastUsed < oldestTime) {
        oldestTime = value.lastUsed;
        oldest = key;
      }
    }

    if (oldest) {
      const evicted = this.clients.get(oldest);
      if (evicted) {
        evicted.client.$disconnect();
        this.clients.delete(oldest);
      }
    }
  }

  /**
   * Remove clientes ociosos (sem uso por CLIENT_IDLE_MS).
   */
  private evictIdleClients(): void {
    const now = Date.now();
    const toEvict: string[] = [];

    for (const [key, value] of this.clients.entries()) {
      if (now - value.lastUsed > this.CLIENT_IDLE_MS) {
        toEvict.push(key);
      }
    }

    for (const key of toEvict) {
      const client = this.clients.get(key);
      if (client) {
        client.client.$disconnect();
        this.clients.delete(key);
      }
    }
  }

  getPoolStats() {
    return {
      activeClients: this.clients.size,
      maxClients: this.MAX_CLIENTS,
      schemas: Array.from(this.clients.keys()),
    };
  }

  async onModuleDestroy() {
    clearInterval(this.cleanupInterval);

    await this.defaultClient.$disconnect();

    for (const [, cached] of this.clients.entries()) {
      await cached.client.$disconnect();
    }

    this.clients.clear();
  }
}
