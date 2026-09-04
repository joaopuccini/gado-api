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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FazendasService = void 0;
const common_1 = require("@nestjs/common");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const context_1 = require("../common/context");
let FazendasService = class FazendasService {
    tenantPrisma;
    constructor(tenantPrisma) {
        this.tenantPrisma = tenantPrisma;
    }
    getTenantClient() {
        const schemaName = context_1.RequestContext.getSchemaName();
        if (!schemaName)
            throw new Error('Schema do tenant não encontrado no contexto');
        return this.tenantPrisma.getClientForSchema(schemaName);
    }
    async findAll() {
        const tenant = this.getTenantClient();
        return tenant.fazenda.findMany({
            where: { ativo: true }
        });
    }
    async findOne(id) {
        const tenant = this.getTenantClient();
        const fazenda = await tenant.fazenda.findUnique({
            where: { id }
        });
        if (!fazenda || !fazenda.ativo)
            throw new common_1.NotFoundException('Fazenda não encontrada');
        return fazenda;
    }
    async findByUserId(usuarioLocalId) {
        const tenant = this.getTenantClient();
        const userFazendas = await tenant.usuarioFazenda.findMany({
            where: { usuarioId: usuarioLocalId, ativo: true },
            include: { fazenda: true }
        });
        return userFazendas.map(uf => uf.fazenda);
    }
    async create(data) {
        const tenant = this.getTenantClient();
        return tenant.fazenda.create({
            data: {
                ...data,
                ativo: true,
            }
        });
    }
    async update(id, data) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return tenant.fazenda.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return tenant.fazenda.update({
            where: { id },
            data: { ativo: false }
        });
    }
};
exports.FazendasService = FazendasService;
exports.FazendasService = FazendasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], FazendasService);
//# sourceMappingURL=fazendas.service.js.map