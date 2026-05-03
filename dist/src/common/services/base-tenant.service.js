"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTenantService = void 0;
const common_1 = require("@nestjs/common");
const context_1 = require("../context");
class BaseTenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async withTenant(operation) {
        const fazendaId = context_1.RequestContext.getFazendaId();
        if (!fazendaId) {
            throw new common_1.NotFoundException('Fazenda não identificada no contexto');
        }
        await this.prisma.$executeRawUnsafe(`SET search_path TO "fazenda_${fazendaId}", public`);
        try {
            return await operation();
        }
        finally {
            await this.prisma.$executeRawUnsafe(`SET search_path TO "gado_fazendas", public`);
        }
    }
    async create(dto) {
        return this.withTenant(() => this.getDelegate().create({ data: dto }));
    }
    async findAll(options) {
        return this.withTenant(async () => {
            const where = { ...options?.where, excluido: false };
            const [data, total] = await Promise.all([
                this.getDelegate().findMany({
                    where,
                    skip: options?.skip,
                    take: options?.take,
                    include: options?.include,
                    orderBy: { id: 'asc' },
                }),
                this.getDelegate().count({ where }),
            ]);
            return { data, total };
        });
    }
    async findOne(id, include) {
        return this.withTenant(async () => {
            const record = await this.getDelegate().findFirst({
                where: { id, excluido: false },
                include,
            });
            if (!record) {
                throw new common_1.NotFoundException(`${this.modelName} #${id} não encontrado`);
            }
            return record;
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.withTenant(() => this.getDelegate().update({
            where: { id },
            data: dto,
        }));
    }
    async remove(id) {
        await this.findOne(id);
        return this.withTenant(() => this.getDelegate().update({
            where: { id },
            data: { excluido: true, excluido_data: new Date() },
        }));
    }
}
exports.BaseTenantService = BaseTenantService;
//# sourceMappingURL=base-tenant.service.js.map