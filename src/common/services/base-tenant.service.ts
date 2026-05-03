import { NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContext } from '../context';

/**
 * Base CRUD service for tenant-scoped entities.
 * All domain modules (animais, lotes, racas, etc.) extend this.
 *
 * Handles: search_path switching, soft-delete, pagination, common CRUD.
 */
export abstract class BaseTenantService<CreateDto, UpdateDto> {
    protected abstract readonly logger: Logger;
    protected abstract readonly modelName: string;

    constructor(protected readonly prisma: PrismaService) { }

    /**
     * Returns the Prisma delegate for the model (e.g., prisma.animal).
     * Must be implemented by each service.
     */
    protected abstract getDelegate(): any;

    /**
     * Sets the search_path to the tenant's schema before executing.
     */
    protected async withTenant<T>(operation: () => Promise<T>): Promise<T> {
        const fazendaId = RequestContext.getFazendaId();
        if (!fazendaId) {
            throw new NotFoundException('Fazenda não identificada no contexto');
        }

        await this.prisma.$executeRawUnsafe(
            `SET search_path TO "fazenda_${fazendaId}", public`,
        );

        try {
            return await operation();
        } finally {
            await this.prisma.$executeRawUnsafe(
                `SET search_path TO "gado_fazendas", public`,
            );
        }
    }

    async create(dto: CreateDto) {
        return this.withTenant(() =>
            this.getDelegate().create({ data: dto as any }),
        );
    }

    async findAll(options?: { skip?: number; take?: number; where?: any; include?: any }) {
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

    async findOne(id: number, include?: any) {
        return this.withTenant(async () => {
            const record = await this.getDelegate().findFirst({
                where: { id, excluido: false },
                include,
            });
            if (!record) {
                throw new NotFoundException(`${this.modelName} #${id} não encontrado`);
            }
            return record;
        });
    }

    async update(id: number, dto: UpdateDto) {
        await this.findOne(id); // Verifica existência
        return this.withTenant(() =>
            this.getDelegate().update({
                where: { id },
                data: dto as any,
            }),
        );
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica existência
        return this.withTenant(() =>
            this.getDelegate().update({
                where: { id },
                data: { excluido: true, excluido_data: new Date() },
            }),
        );
    }
}
