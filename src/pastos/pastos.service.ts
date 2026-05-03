import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';

@Injectable()
export class PastosService extends BaseTenantService<CreatePastoDto, UpdatePastoDto> {
    protected readonly logger = new Logger(PastosService.name);
    protected readonly modelName = 'Pasto';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.pasto; }
}
