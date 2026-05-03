import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';

@Injectable()
export class MovimentoPastoService extends BaseTenantService<CreateMovPastoDto, any> {
    protected readonly logger = new Logger(MovimentoPastoService.name);
    protected readonly modelName = 'Movimentação Pasto';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.movimentoAnimalPasto; }
}

@Injectable()
export class MovimentoLoteService extends BaseTenantService<CreateMovLoteDto, any> {
    protected readonly logger = new Logger(MovimentoLoteService.name);
    protected readonly modelName = 'Movimentação Lote';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.movimentoLote; }
}
