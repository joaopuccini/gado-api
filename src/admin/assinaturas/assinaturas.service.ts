import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AdminPrismaService } from '../admin-prisma.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';

@Injectable()
export class AssinaturasService {
  constructor(private readonly prisma: AdminPrismaService) {}

  async create(createAssinaturaDto: CreateAssinaturaDto) {
    const plano = await this.prisma.plano.findUnique({
      where: { id: createAssinaturaDto.planoId },
    });
    if (!plano) throw new NotFoundException('Plano não encontrado');

    const organizacao = await this.prisma.organizacao.findUnique({
      where: { id: createAssinaturaDto.organizacaoId },
    });
    if (!organizacao) throw new NotFoundException('Organização não encontrada');

    return await this.prisma.$transaction(async (tx) => {
      // Cria a assinatura principal
      const dataInicio = new Date();
      const dataVencimento = new Date();
      dataVencimento.setMonth(dataVencimento.getMonth() + 1);

      const assinatura = await tx.assinatura.create({
        data: {
          organizacaoId: organizacao.id,
          planoId: plano.id,
          diaVencimento: createAssinaturaDto.diaVencimento,
          dataInicio,
          dataVencimento,
          status: 'ATIVA',
        },
      });

      // Se passou o número de meses, gera os boletos futuros (mensalidades)
      const meses = createAssinaturaDto.mesesGerarPagamento || 1;
      
      for (let i = 0; i < meses; i++) {
        const d = new Date(dataInicio);
        d.setMonth(d.getMonth() + i);
        const compAno = d.getFullYear();
        const compMes = String(d.getMonth() + 1).padStart(2, '0');
        
        await tx.pagamento.create({
          data: {
            assinaturaId: assinatura.id,
            valor: plano.precoMensal,
            competencia: `${compAno}-${compMes}`,
            status: 'PENDENTE',
          },
        });
      }

      return assinatura;
    });
  }

  async findAll() {
    return await this.prisma.assinatura.findMany({
      include: {
        organizacao: true,
        plano: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { id },
      include: { organizacao: true, plano: true, pagamentos: true },
    });
    if (!assinatura) throw new NotFoundException(`Assinatura #${id} não encontrada`);
    return assinatura;
  }

  async update(id: string, updateAssinaturaDto: UpdateAssinaturaDto) {
    try {
      return await this.prisma.assinatura.update({
        where: { id },
        data: updateAssinaturaDto,
      });
    } catch (e) {
      throw new NotFoundException(`Assinatura #${id} não encontrada`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.assinatura.update({
        where: { id },
        data: { status: 'CANCELADA' },
      });
    } catch (e) {
      throw new NotFoundException(`Assinatura #${id} não encontrada`);
    }
  }

  // Baixa de Pagamento
  async registrarPagamento(pagamentoId: string, valorPago: number) {
    const pagamento = await this.prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: { assinatura: true }
    });

    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');
    if (pagamento.status === 'PAGO') throw new ConflictException('Este pagamento já foi baixado');

    return await this.prisma.$transaction(async (tx) => {
      const pag = await tx.pagamento.update({
        where: { id: pagamentoId },
        data: {
          status: 'PAGO',
          dataPagamento: new Date(),
          observacao: `Valor pago: ${valorPago}`,
        }
      });

      // Atualiza o vencimento da assinatura empurrando mais 30 dias (lógica do financeiro antigo)
      const novaDataVenc = new Date(pagamento.assinatura.dataVencimento);
      novaDataVenc.setMonth(novaDataVenc.getMonth() + 1);

      await tx.assinatura.update({
        where: { id: pagamento.assinaturaId },
        data: {
          dataVencimento: novaDataVenc,
          status: 'ATIVA',
        }
      });

      // Aumenta o tempo da Organização para ATIVO também se tava suspensa (migração do SyncEditarFazenda)
      await tx.organizacao.update({
        where: { id: pagamento.assinatura.organizacaoId },
        data: { status: 'ATIVO' }
      });

      return pag;
    });
  }
}
