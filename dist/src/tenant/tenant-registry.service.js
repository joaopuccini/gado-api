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
var TenantRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRegistryService = void 0;
const common_1 = require("@nestjs/common");
const client_admin_1 = require("@prisma/client-admin");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
let TenantRegistryService = TenantRegistryService_1 = class TenantRegistryService {
    logger = new common_1.Logger(TenantRegistryService_1.name);
    adminClient;
    constructor() {
        const databaseUrl = process.env.DATABASE_URL || '';
        const pool = new pg_1.Pool({
            connectionString: databaseUrl,
        });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        this.adminClient = new client_admin_1.PrismaClient({
            adapter
        });
    }
    async findBySubdomain(subdomain) {
        try {
            return await this.adminClient.tenantRegistry.findUnique({
                where: { subdomain },
                include: { organizacao: true },
            });
        }
        catch (e) {
            this.logger.error(`Erro ao buscar tenant por subdomain: ${e.message}`);
            return null;
        }
    }
    async findById(id) {
        try {
            return await this.adminClient.tenantRegistry.findUnique({
                where: { id },
                include: { organizacao: true },
            });
        }
        catch (e) {
            this.logger.error(`Erro ao buscar tenant por id: ${e.message}`);
            return null;
        }
    }
    async onModuleDestroy() {
        await this.adminClient.$disconnect();
    }
};
exports.TenantRegistryService = TenantRegistryService;
exports.TenantRegistryService = TenantRegistryService = TenantRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TenantRegistryService);
//# sourceMappingURL=tenant-registry.service.js.map