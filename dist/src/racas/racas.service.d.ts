import { Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';
export declare class RacasService extends BaseTenantService<CreateRacaDto, UpdateRacaDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Ra\u00E7a";
    constructor(tenantPrisma: TenantPrismaService);
    protected getDelegate(tenant: any): any;
}
