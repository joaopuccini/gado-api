import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { BaseTenantService } from '../common/services';
import { CreateVendaDto } from './dto/venda.dto';

@Injectable()
export class VendasService extends BaseTenantService<CreateVendaDto, any> {
    protected readonly logger = new Logger(VendasService.name);
    protected readonly modelName = 'Venda';
    constructor(tenantPrisma: TenantPrismaService) { super(tenantPrisma); }
    protected getDelegate(tenant: any) { return tenant.venda; }

    // Lógica complexa de venda com atualização de status do animal e registros individuais
    override async create(dto: CreateVendaDto) {
        const tenant = this.getTenantClient();
        
        // 1. Criar registro de Venda principal
        const venda = await tenant.venda.create({
            data: {
                clienteId: dto.id_cliente,
                valorTotal: dto.valor_venda,
                custoTotal: dto.valor_custo || 0,
                lucro: (dto.valor_venda || 0) - (dto.valor_custo || 0),
                dataVenda: dto.data_venda ? new Date(dto.data_venda) : new Date(),
                observacao: dto.observacao,
                ativo: true,
            } as any,
        });

        if (dto.id_animais && dto.id_animais.length > 0) {
            // 2. Atualizar status dos animais para 'VENDIDO'
            await tenant.animal.updateMany({
                where: { id: { in: dto.id_animais } },
                data: { status: 'VENDIDO' },
            });

            // 3. Criar registros individuais (itens_venda)
            const valorVendaCabeca = dto.valor_venda / dto.id_animais.length;
            const valorCustoCabeca = (dto.valor_custo || 0) / dto.id_animais.length;

            const vendaAnimaisData = dto.id_animais.map(animalId => ({
                vendaId: venda.id,
                animalId: animalId,
                valorFinal: valorVendaCabeca,
                custoFinal: valorCustoCabeca,
            }));

            await tenant.itemVenda.createMany({
                data: vendaAnimaisData as any,
            });
        }

        return venda;
    }
}
