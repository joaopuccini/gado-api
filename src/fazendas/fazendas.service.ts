import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { RequestContext } from '../common/context';

@Injectable()
export class FazendasService {
    constructor(private readonly tenantPrisma: TenantPrismaService) { }

    private getTenantClient() {
        const schemaName = RequestContext.getSchemaName();
        if (!schemaName) throw new Error('Schema do tenant não encontrado no contexto');
        return this.tenantPrisma.getClientForSchema(schemaName);
    }

    async findAll() {
        const tenant = this.getTenantClient();
        return tenant.fazenda.findMany({
            where: { ativo: true }
        });
    }

    async findOne(id: number) {
        const tenant = this.getTenantClient();
        const fazenda = await tenant.fazenda.findUnique({
            where: { id }
        });
        if (!fazenda || !fazenda.ativo) throw new NotFoundException('Fazenda não encontrada');
        return fazenda;
    }

    async findByUserId(usuarioLocalId: number) {
        const tenant = this.getTenantClient();
        const userFazendas = await tenant.usuarioFazenda.findMany({
            where: { usuarioId: usuarioLocalId, ativo: true },
            include: { fazenda: true }
        });
        return userFazendas.map(uf => uf.fazenda);
    }

    async create(data: any) {
        const tenant = this.getTenantClient();
        return tenant.fazenda.create({
            data: {
                ...data,
                ativo: true,
            }
        });
    }

    async update(id: number, data: any) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return tenant.fazenda.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        const tenant = this.getTenantClient();
        await this.findOne(id);
        return tenant.fazenda.update({
            where: { id },
            data: { ativo: false }
        });
    }
}
