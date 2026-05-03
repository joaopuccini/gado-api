import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';

@Injectable()
export class RacasService extends BaseTenantService<CreateRacaDto, UpdateRacaDto> {
    protected readonly logger = new Logger(RacasService.name);
    protected readonly modelName = 'Raça';

    constructor(prisma: PrismaService) { super(prisma); }

    protected getDelegate() { return this.prisma.raca; }
}
