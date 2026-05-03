import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';
export declare class MovimentoPastoService extends BaseTenantService<CreateMovPastoDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Movimenta\u00E7\u00E3o Pasto";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.MovimentoAnimalPastoDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
export declare class MovimentoLoteService extends BaseTenantService<CreateMovLoteDto, any> {
    protected readonly logger: Logger;
    protected readonly modelName = "Movimenta\u00E7\u00E3o Lote";
    constructor(prisma: PrismaService);
    protected getDelegate(): import("@prisma/client").Prisma.MovimentoLoteDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
