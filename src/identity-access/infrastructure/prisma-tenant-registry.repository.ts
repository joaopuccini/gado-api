import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import {
  getPermissionsForRole,
  type FazendaRole,
} from '../../common/rbac/rbac.config';
import { TenantPrismaClientFactory } from '../../tenant/infrastructure/tenant-prisma-client.factory';
import { TenantSchemaName } from '../../tenant/infrastructure/schema-name';
import type {
  TenantMembershipRecord,
  TenantRegistryRecord,
  TenantRegistryRepository,
  TenantRegistryStatus,
} from '../application/ports/tenant-registry.repository';

const normalizedStatus = (
  registryStatus: string,
  organizationStatus: string,
): TenantRegistryStatus => {
  if (registryStatus === 'REMOVIDO' || organizationStatus === 'CANCELADO') {
    return 'removed';
  }
  if (registryStatus === 'BLOQUEADO' || organizationStatus === 'SUSPENSO') {
    return 'blocked';
  }
  if (
    registryStatus === 'ATIVO' &&
    ['ATIVO', 'TRIAL'].includes(organizationStatus)
  ) {
    return 'active';
  }
  return 'provisioning';
};

@Injectable()
export class PrismaTenantRegistryRepository implements TenantRegistryRepository {
  constructor(
    private readonly adminPrisma: AdminPrismaService,
    private readonly tenantClientFactory: TenantPrismaClientFactory,
  ) {}

  async findById(tenantId: string): Promise<TenantRegistryRecord | null> {
    const registry = await this.adminPrisma.tenantRegistry.findFirst({
      where: {
        OR: [{ id: tenantId }, { organizacaoId: tenantId }],
      },
      include: { organizacao: true },
    });
    if (!registry) return null;

    return {
      tenantId: registry.id,
      organizationId: registry.organizacaoId,
      schemaName: registry.schemaName,
      subdomain: registry.subdomain.toLowerCase(),
      status: normalizedStatus(registry.status, registry.organizacao.status),
    };
  }

  async findMembership(
    tenant: TenantRegistryRecord,
    globalUserId: string,
  ): Promise<TenantMembershipRecord | null> {
    const organizationAccess =
      await this.adminPrisma.acessoOrganizacao.findUnique({
        where: {
          usuarioGlobalId_organizacaoId: {
            usuarioGlobalId: globalUserId,
            organizacaoId: tenant.organizationId,
          },
        },
      });
    if (organizationAccess?.status !== 'ATIVO') return null;

    const client = this.tenantClientFactory.create(
      TenantSchemaName.parse(tenant.schemaName),
    );
    const localUser = await client.usuario.findFirst({
      where: { globalUserId, ativo: true },
      include: {
        perfil: {
          include: {
            permissoes: { include: { permissao: true } },
          },
        },
        permissoes: { include: { permissao: true } },
        fazendas: {
          where: { ativo: true },
          include: { fazenda: true },
        },
      },
    });
    if (!localUser) return null;

    const userPermissions = [
      ...(localUser.perfil?.permissoes ?? []).map(
        ({ permissao }) => permissao.codigo,
      ),
      ...localUser.permissoes
        .filter(({ ativo, permissao }) => ativo && permissao.ativo)
        .map(({ permissao }) => permissao.codigo),
    ];

    return {
      localUserId: localUser.id,
      farms: localUser.fazendas
        .filter(({ fazenda }) => fazenda.ativo)
        .map(({ fazendaId, role }) => ({
          farmId: fazendaId,
          permissions: [
            ...new Set([
              ...getPermissionsForRole(role as FazendaRole),
              ...userPermissions,
            ]),
          ],
        })),
    };
  }
}
