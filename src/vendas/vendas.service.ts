import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVendaDto } from './dto/venda.dto';

@Injectable()
export class VendasService extends BaseTenantService<CreateVendaDto, any> {
    protected readonly logger = new Logger(VendasService.name);
    protected readonly modelName = 'Venda';
    constructor(prisma: PrismaService) { super(prisma); }
    protected getDelegate() { return this.prisma.venda; }

    // Lógica complexa de venda com atualização de status do animal e registros individuais
    override async create(dto: CreateVendaDto) {
        return this.withTenant(async () => {
            // 1. Criar registro de Venda principal
            const venda = await this.prisma.venda.create({
                data: {
                    id_animais: dto.id_animais,
                    id_cliente: dto.id_cliente,
                    qtd_animais: dto.id_animais.length,
                    valor_venda: dto.valor_venda,
                    valor_custo: dto.valor_custo || 0,
                    data_venda: dto.data_venda ? new Date(dto.data_venda) : new Date(),
                    observacao: dto.observacao,
                },
            });

            // 2. Atualizar status dos animais para 'VENDIDO'
            await this.prisma.animal.updateMany({
                where: { id: { in: dto.id_animais } },
                data: { status: 'VENDIDO' },
            });

            // 3. Criar registros individuais (venda_animais)
            const valorVendaCabeca = dto.valor_venda / dto.id_animais.length;
            const valorCustoCabeca = (dto.valor_custo || 0) / dto.id_animais.length;

            const vendaAnimaisData = dto.id_animais.map(animalId => ({
                id_venda: venda.id,
                id_animal: animalId,
                valor_final: valorVendaCabeca,
                valor_custo_final: valorCustoCabeca,
            }));

            await this.prisma.vendaAnimal.createMany({
                data: vendaAnimaisData,
            });

            return venda;
        });
    }
}
