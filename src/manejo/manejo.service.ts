import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';

@Injectable()
export class ManejoService extends BaseTenantService<CreateManejoDto, UpdateManejoDto> {
    protected readonly logger = new Logger(ManejoService.name);
    protected readonly modelName = 'Manejo';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.manejoReproducao; }
}

