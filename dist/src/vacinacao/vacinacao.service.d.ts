import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';
export declare class VacinacaoService extends BaseTenantService<CreateVacinacaoDto, UpdateVacinacaoDto> {
    protected readonly logger: Logger;
    protected readonly modelName = "Vacina\u00E7\u00E3o";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.VacinacaoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
