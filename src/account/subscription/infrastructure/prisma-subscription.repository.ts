import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  SubscriptionLimits,
  SubscriptionRepository,
  SubscriptionSummaryRecord,
} from '../application/ports/subscription.repository';

const statusMap = {
  ATIVA: 'active',
  VENCIDA: 'expired',
  CANCELADA: 'canceled',
} as const;

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(
    private readonly admin: AdminPrismaService,
    private readonly tenant: TenantPrismaService,
  ) {}

  async findLimits(organizationId: string): Promise<SubscriptionLimits | null> {
    const subscription = await this.latest(organizationId);
    if (!subscription) return null;
    return {
      organizationId: subscription.organizacaoId,
      maxUsers: subscription.plano.maxUsuarios,
      maxFarms: subscription.plano.maxFazendas,
      status: subscription.status === 'ATIVA' ? 'active' : 'expired',
      expiresAt: subscription.dataVencimento,
    };
  }

  async findSummary(
    organizationId: string,
  ): Promise<SubscriptionSummaryRecord | null> {
    const subscription = await this.latest(organizationId);
    if (!subscription) return null;
    return {
      organizationId: subscription.organizacaoId,
      planName: subscription.plano.nome,
      status: statusMap[subscription.status],
      startsAt: subscription.dataInicio,
      expiresAt: subscription.dataVencimento,
      maxUsers: subscription.plano.maxUsuarios,
      maxFarms: subscription.plano.maxFazendas,
    };
  }

  countActiveOrganizationUsers(organizationId: string): Promise<number> {
    return this.admin.acessoOrganizacao.count({
      where: { organizacaoId: organizationId, status: 'ATIVO' },
    });
  }

  countActiveTenantFarms(): Promise<number> {
    return this.tenant.getClient().fazenda.count({ where: { ativo: true } });
  }

  private latest(organizationId: string) {
    return this.admin.assinatura.findFirst({
      where: { organizacaoId: organizationId },
      orderBy: [{ dataInicio: 'desc' }, { createdAt: 'desc' }],
      select: {
        organizacaoId: true,
        status: true,
        dataInicio: true,
        dataVencimento: true,
        plano: {
          select: {
            nome: true,
            maxUsuarios: true,
            maxFazendas: true,
          },
        },
      },
    });
  }
}
