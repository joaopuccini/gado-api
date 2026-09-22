import { Injectable } from '@nestjs/common';
import {
  getPermissionsForRole,
  type FazendaRole,
} from '../../../common/rbac/rbac.config';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  CreateFarmRecord,
  FarmRepository,
  FarmView,
  UpdateFarmRecord,
} from '../application/ports/farm.repository';
import type {
  FarmAccessRepository,
  VerifiedFarmAccess,
} from '../application/ports/farm-session.ports';

const FARM_SELECT = {
  id: true,
  nome: true,
  parentId: true,
  ativo: true,
} as const;

interface PersistedFarm {
  readonly id: number;
  readonly nome: string;
  readonly parentId: number | null;
  readonly ativo: boolean;
}

const toFarmView = (farm: PersistedFarm): FarmView => ({
  id: farm.id,
  name: farm.nome,
  parentId: farm.parentId,
  active: farm.ativo,
});

@Injectable()
export class PrismaFarmRepository
  implements FarmRepository, FarmAccessRepository
{
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async listHierarchy() {
    const farms = await this.tenantPrisma.getClient().fazenda.findMany({
      select: { id: true, parentId: true, ativo: true },
    });
    return farms.map(({ id, parentId, ativo }) => ({
      id,
      parentId,
      active: ativo,
    }));
  }

  async listAccessible(
    farmIds: readonly number[],
  ): Promise<readonly FarmView[]> {
    const farms = await this.tenantPrisma.getClient().fazenda.findMany({
      where: { id: { in: [...farmIds] }, ativo: true },
      orderBy: [{ parentId: 'asc' }, { nome: 'asc' }],
      select: FARM_SELECT,
    });
    return farms.map(toFarmView);
  }

  async findAccessible(
    id: number,
    farmIds: readonly number[],
  ): Promise<FarmView | null> {
    const farm = await this.tenantPrisma.getClient().fazenda.findFirst({
      where: { AND: [{ id }, { id: { in: [...farmIds] } }] },
      select: FARM_SELECT,
    });
    return farm ? toFarmView(farm) : null;
  }

  async create(input: CreateFarmRecord): Promise<FarmView> {
    return this.tenantPrisma.getClient().$transaction(async (transaction) => {
      const farm = await transaction.fazenda.create({
        data: {
          nome: input.name,
          parentId: input.parentId,
          ativo: true,
        },
        select: FARM_SELECT,
      });
      await transaction.usuarioFazenda.create({
        data: {
          usuarioId: input.ownerLocalUserId,
          fazendaId: farm.id,
          role: 'DONO',
          ativo: true,
        },
      });
      return toFarmView(farm);
    });
  }

  async update(id: number, input: UpdateFarmRecord): Promise<FarmView> {
    const farm = await this.tenantPrisma.getClient().fazenda.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { nome: input.name } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
      select: FARM_SELECT,
    });
    return toFarmView(farm);
  }

  async deactivate(id: number): Promise<FarmView> {
    const farm = await this.tenantPrisma.getClient().fazenda.update({
      where: { id },
      data: { ativo: false },
      select: FARM_SELECT,
    });
    return toFarmView(farm);
  }

  async findActiveAccess(
    localUserId: number,
    farmId: number,
  ): Promise<VerifiedFarmAccess | null> {
    const membership = await this.tenantPrisma
      .getClient()
      .usuarioFazenda.findFirst({
        where: { usuarioId: localUserId, fazendaId: farmId, ativo: true },
        include: {
          fazenda: { select: { ativo: true } },
          usuario: {
            include: {
              perfil: {
                include: {
                  permissoes: { include: { permissao: true } },
                },
              },
              permissoes: { include: { permissao: true } },
            },
          },
        },
      });
    if (!membership?.fazenda.ativo) return null;

    const profilePermissions = (membership.usuario.perfil?.permissoes ?? [])
      .filter(({ permissao }) => permissao.ativo)
      .map(({ permissao }) => permissao.codigo);
    const userPermissions = membership.usuario.permissoes
      .filter(({ ativo, permissao }) => ativo && permissao.ativo)
      .map(({ permissao }) => permissao.codigo);

    return {
      farmId: membership.fazendaId,
      role: membership.role,
      permissions: [
        ...new Set([
          ...getPermissionsForRole(membership.role as FazendaRole),
          ...profilePermissions,
          ...userPermissions,
        ]),
      ],
    };
  }
}
