import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';
export declare class LotesService extends BaseTenantService<CreateLoteDto, UpdateLoteDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Lote";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.LoteDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
