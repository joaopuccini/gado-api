import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateKiloDto, UpdateKiloDto } from './dto/kilo.dto';

@Injectable()
export class KilosService extends BaseTenantService<CreateKiloDto, UpdateKiloDto> {
    protected readonly logger = new Logger(KilosService.name);
    protected readonly modelName = 'Pesagem';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.kilo; }
}
