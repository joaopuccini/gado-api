import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';

@Injectable()
export class LotesService extends BaseTenantService<CreateLoteDto, UpdateLoteDto> {
    protected readonly logger = new Logger(LotesService.name);
    protected readonly modelName = 'Lote';

    constructor(prisma: PrismaService) {
        super(prisma);
    }

    protected getDelegate() {
        return this.prisma.lote;
    }
}
