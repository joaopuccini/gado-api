import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';

@Injectable()
export class VacinacaoService extends BaseTenantService<CreateVacinacaoDto, UpdateVacinacaoDto> {
    protected readonly logger = new Logger(VacinacaoService.name);
    protected readonly modelName = 'Vacinação';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.vacinacao; }
}
