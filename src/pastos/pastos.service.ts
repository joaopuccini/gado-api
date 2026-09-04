import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';

@Injectable()
export class PastosService extends BaseTenantService<CreatePastoDto, UpdatePastoDto> {
    protected readonly logger = new Logger(PastosService.name);
    protected readonly modelName = 'Pasto';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.pasto; }
}

