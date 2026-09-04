"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TenantPrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPrismaService = exports.globalTenantPrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const tenant_context_1 = require("./tenant.context");
const request_context_1 = require("../common/context/request-context");
exports.globalTenantPrismaService = null;
let TenantPrismaService = TenantPrismaService_1 = class TenantPrismaService {
    logger = new common_1.Logger(TenantPrismaService_1.name);
    clients = new Map();
    MAX_CLIENTS = 50;
    CLIENT_IDLE_MS = 300_000;
    defaultClient;
    cleanupInterval;
    constructor() {
        exports.globalTenantPrismaService = this;
        const databaseUrl = process.env.DATABASE_URL || '';
        const pool = new pg_1.Pool({
            connectionString: databaseUrl,
        });
        const adminTables = ['admin_users', 'assinaturas', 'organizacoes', 'pagamentos', 'planos', 'tenant_registry'];
        const interceptQuery = (originalQuery, schemaReplacement) => {
            return function (...args) {
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
                }
                else if (queryConfig && typeof queryConfig === 'object') {
                    queryConfig.text = text;
                }
                try {
                    return originalQuery(...args);
                }
                catch (error) {
                    throw error;
                }
            };
        };
        pool.query = interceptQuery(pool.query.bind(pool), 'public');
        pool.on('connect', (client) => {
            client.query = interceptQuery(client.query.bind(client), 'public');
        });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        this.defaultClient = new client_1.PrismaClient({ adapter });
        this.cleanupInterval = setInterval(() => this.evictIdleClients(), 120_000);
        this.cleanupInterval.unref();
    }
    getClient() {
        const tenant = tenant_context_1.TenantContext.get();
        if (!tenant) {
            return this.defaultClient;
        }
        return this.getClientForSchema(tenant.schemaName);
    }
    getClientForSchema(schemaName) {
        const cached = this.clients.get(schemaName);
        if (cached) {
            cached.lastUsed = Date.now();
            return cached.client;
        }
        this.logger.log(`Cache MISS para schema: ${schemaName} - criando novo pool`);
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
    createClientForSchema(schemaName) {
        const databaseUrl = process.env.DATABASE_URL || '';
        const adminTables = ['admin_users', 'assinaturas', 'organizacoes', 'pagamentos', 'planos', 'tenant_registry'];
        const interceptQuery = (originalQuery, schemaReplacement) => {
            return function (...args) {
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
                }
                else if (queryConfig && typeof queryConfig === 'object') {
                    queryConfig.text = text;
                }
                try {
                    return originalQuery(...args);
                }
                catch (error) {
                    throw error;
                }
            };
        };
        const pool = new pg_1.Pool({
            connectionString: databaseUrl,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 5,
        });
        pool.on('connect', (client) => {
            client.query = interceptQuery(client.query.bind(client), schemaName);
        });
        pool.on('error', (err) => {
            this.logger.error(`[Pool: ${schemaName}] Erro no pool: ${err.message}`);
        });
        pool.query = interceptQuery(pool.query.bind(pool), schemaName);
        const adapter = new adapter_pg_1.PrismaPg(pool);
        const client = new client_1.PrismaClient({ adapter, log: ['query', 'error'] });
        const extendedClient = client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const modelsWithFazenda = [
                            'Animal', 'Lote', 'Pasto', 'Almoxarifado', 'Produto', 'PedidoCompra', 'Safra', 'ContaBancaria', 'ContaPagar', 'ContaReceber', 'Maquina',
                            'Custo', 'CustoAnimal', 'Venda', 'ItemVenda', 'Caixa', 'Pesagem', 'Vacinacao', 'Foto', 'ManejoReproducao', 'MovimentoPasto', 'MovimentoLote',
                            'MovimentoEstoque', 'ItemPedidoCompra', 'TransacaoBancaria', 'Abastecimento', 'Manutencao'
                        ];
                        const fazendaId = request_context_1.RequestContext.getFazendaId();
                        const accessibleFazendaIds = request_context_1.RequestContext.getAccessibleFazendaIds() || (fazendaId ? [fazendaId] : []);
                        console.log(`[Extension] model=${model} operation=${operation} fazendaId=${fazendaId}`);
                        const anyArgs = args;
                        if (fazendaId && modelsWithFazenda.includes(model)) {
                            if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
                            }
                            else if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
                                const firstOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
                                console.log(`[Extension] converted ${operation} to ${firstOp}, modified args:`, JSON.stringify(anyArgs));
                                return client[model][firstOp](anyArgs);
                            }
                            else if (['create', 'createMany'].includes(operation)) {
                                const enforceFazendaId = (data) => {
                                    if (data.fazendaId && accessibleFazendaIds.includes(data.fazendaId)) {
                                        return data;
                                    }
                                    return { ...data, fazendaId };
                                };
                                if (Array.isArray(anyArgs.data)) {
                                    anyArgs.data = anyArgs.data.map(enforceFazendaId);
                                }
                                else {
                                    anyArgs.data = enforceFazendaId(anyArgs.data);
                                }
                            }
                            else if (['update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
                                anyArgs.where = { ...anyArgs.where, fazendaId: { in: accessibleFazendaIds } };
                            }
                            console.log(`[Extension] modified args:`, JSON.stringify(anyArgs));
                        }
                        return query(anyArgs);
                    },
                },
            },
        });
        return extendedClient;
    }
    evictLeastRecentlyUsed() {
        let oldest = null;
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
    evictIdleClients() {
        const now = Date.now();
        const toEvict = [];
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
};
exports.TenantPrismaService = TenantPrismaService;
exports.TenantPrismaService = TenantPrismaService = TenantPrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TenantPrismaService);
//# sourceMappingURL=tenant-prisma.service.js.map