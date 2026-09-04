import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';

@Injectable()
export class MovimentoPastoService extends BaseTenantService<CreateMovPastoDto, any> {
    protected readonly logger = new Logger(MovimentoPastoService.name);
    protected readonly modelName = 'Movimentação Pasto';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.movimentoAnimalPasto; }
}

@Injectable()
export class MovimentoLoteService extends BaseTenantService<CreateMovLoteDto, any> {
    protected readonly logger = new Logger(MovimentoLoteService.name);
    protected readonly modelName = 'Movimentação Lote';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.movimentoLote; }
}

