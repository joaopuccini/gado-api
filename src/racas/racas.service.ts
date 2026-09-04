import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';

@Injectable()
export class RacasService extends BaseTenantService<CreateRacaDto, UpdateRacaDto> {
    protected readonly logger = new Logger(RacasService.name);
    protected readonly modelName = 'Raça';

    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }

    protected getDelegate(tenant: any) { return tenant.raca; }
}

