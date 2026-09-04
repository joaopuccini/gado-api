import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';

@Injectable()
export class VacinacaoService extends BaseTenantService<CreateVacinacaoDto, UpdateVacinacaoDto> {
    protected readonly logger = new Logger(VacinacaoService.name);
    protected readonly modelName = 'Vacinação';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.vacinacao; }
}

