import { NotFoundException, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';
import { RequestContext } from '../context';

export abstract class BaseTenantService<CreateDto, UpdateDto> {
    protected abstract readonly logger: Logger;
    protected abstract readonly modelName: string;

    constructor(protected readonly tenantPrisma: TenantPrismaService) { }

    protected getTenantClient() {
        return this.tenantPrisma.getClient();
    }

    protected abstract getDelegate(tenant: any): any;

    async create(dto: CreateDto) {
        const tenant = this.getTenantClient();
        const data = { ...dto, ativo: true } as any;
        return this.getDelegate(tenant).create({ data });
    }

    async findAll(options?: { skip?: number; take?: number; where?: any; include?: any }) {
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

    async findOne(id: number, include?: any) {
        const tenant = this.getTenantClient();
        const record = await this.getDelegate(tenant).findFirst({
            where: { id, ativo: true },
            include,
        });
        if (!record) {
            throw new NotFoundException(`${this.modelName} #${id} não encontrado`);
        }
        return record;
    }

    async update(id: number, dto: UpdateDto) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return this.getDelegate(tenant).update({
            where: { id },
            data: dto as any,
        });
    }

    async remove(id: number) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return this.getDelegate(tenant).update({
            where: { id },
            data: { ativo: false },
        });
    }
}
