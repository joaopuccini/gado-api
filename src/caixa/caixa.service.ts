import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';

@Injectable()
export class CaixaService extends BaseTenantService<CreateCaixaDto, UpdateCaixaDto> {
    protected readonly logger = new Logger(CaixaService.name);
    protected readonly modelName = 'Caixa';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.caixa; }
}

