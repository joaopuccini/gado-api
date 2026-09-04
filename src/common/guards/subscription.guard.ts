import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import { SKIP_SUBSCRIPTION_CHECK } from './skip-subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private adminPrisma: AdminPrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Obtido pelo JwtStrategy

    if (!user || !user.tenantId) {
      // Se não houver tenantId, pode ser uma rota de seleção, mas deveria usar @SkipSubscriptionCheck()
      return true;
    }

    const tenantRegistry = await this.adminPrisma.tenantRegistry.findUnique({
      where: { id: user.tenantId },
      include: { organizacao: { include: { assinaturas: true } } },
    });

    if (!tenantRegistry || tenantRegistry.status !== 'ATIVO') {
      throw new ForbiddenException('Organização inativa ou suspensa');
    }

    // Pega a assinatura mais recente/ativa
    const assinatura = tenantRegistry.organizacao.assinaturas.find(
      (sub) => sub.status === 'ATIVA',
    );

    if (!assinatura) {
      throw new ForbiddenException('Nenhuma assinatura ativa encontrada para esta organização');
    }

    if (assinatura.dataVencimento < new Date()) {
      throw new ForbiddenException('A assinatura expirou. Renove para continuar utilizando a plataforma.');
    }

    return true;
  }
}
