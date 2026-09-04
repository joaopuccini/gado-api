"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTenantService = void 0;
const common_1 = require("@nestjs/common");
class BaseTenantService {
    tenantPrisma;
    constructor(tenantPrisma) {
        this.tenantPrisma = tenantPrisma;
    }
    getTenantClient() {
        return this.tenantPrisma.getClient();
    }
    async create(dto) {
        const tenant = this.getTenantClient();
        const data = { ...dto, ativo: true };
        return this.getDelegate(tenant).create({ data });
    }
    async findAll(options) {
        const tenant = this.getTenantClient();
        const where = { ...options?.where, ativo: true };
        const [data, total] = await Promise.all([
            this.getDelegate(tenant).findMany({
                where,
                skip: options?.skip,
                take: options?.take,
                include: options?.include,
                orderBy: { id: 'asc' },
            }),
            this.getDelegate(tenant).count({ where }),
        ]);
        return { data, total };
    }
    async findOne(id, include) {
        const tenant = this.getTenantClient();
        const record = await this.getDelegate(tenant).findFirst({
            where: { id, ativo: true },
            include,
        });
        if (!record) {
            throw new common_1.NotFoundException(`${this.modelName} #${id} não encontrado`);
        }
        return record;
    }
    async update(id, dto) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return this.getDelegate(tenant).update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return this.getDelegate(tenant).update({
            where: { id },
            data: { ativo: false },
        });
    }
}
exports.BaseTenantService = BaseTenantService;
//# sourceMappingURL=base-tenant.service.js.map