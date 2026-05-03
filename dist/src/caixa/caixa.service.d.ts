import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';
export declare class CaixaService extends BaseTenantService<CreateCaixaDto, UpdateCaixaDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Caixa";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.CaixaDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
