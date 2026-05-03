import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';

@Injectable()
export class CaixaService extends BaseTenantService<CreateCaixaDto, UpdateCaixaDto> {
    protected readonly logger = new Logger(CaixaService.name);
    protected readonly modelName = 'Caixa';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.caixa; }
}
