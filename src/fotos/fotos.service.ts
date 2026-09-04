import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';

@Injectable()
export class FotosService extends BaseTenantService<CreateFotoDto, UpdateFotoDto> {
    protected readonly logger = new Logger(FotosService.name);
    protected readonly modelName = 'Foto';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.foto; }
}

