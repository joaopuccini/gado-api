import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';

@Injectable()
export class LotesService extends BaseTenantService<CreateLoteDto, UpdateLoteDto> {
    protected readonly logger = new Logger(LotesService.name);
    protected readonly modelName = 'Lote';

    constructor(tenantPrisma: TenantPrismaService) {
        super(tenantPrisma);
    }

    protected getDelegate() {
        return this.getTenantClient().lote;
    }
}

