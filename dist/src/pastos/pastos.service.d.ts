import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';
export declare class PastosService extends BaseTenantService<CreatePastoDto, UpdatePastoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Pasto";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.PastoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
