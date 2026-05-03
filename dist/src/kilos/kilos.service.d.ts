import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateKiloDto, UpdateKiloDto } from './dto/kilo.dto';
export declare class KilosService extends BaseTenantService<CreateKiloDto, UpdateKiloDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Pesagem";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.KiloDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
