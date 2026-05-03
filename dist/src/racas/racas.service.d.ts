import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';
export declare class RacasService extends BaseTenantService<CreateRacaDto, UpdateRacaDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Ra\u00E7a";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.RacaDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
