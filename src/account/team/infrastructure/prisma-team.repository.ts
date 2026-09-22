import { RoleFazenda } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  AcceptedOrganizationUser,
  OrganizationMemberDirectory,
  ProfileView,
  TeamMemberView,
  TeamRepository,
} from '../application/ports/team.repository';

@Injectable()
export class PrismaOrganizationMemberDirectory implements OrganizationMemberDirectory {
  constructor(private readonly admin: AdminPrismaService) {}

  async findAccepted(
    organizationId: string,
    globalUserId: string,
  ): Promise<AcceptedOrganizationUser | null> {
    const access = await this.admin.acessoOrganizacao.findUnique({
      where: {
        usuarioGlobalId_organizacaoId: {
          usuarioGlobalId: globalUserId,
          organizacaoId: organizationId,
        },
      },
      include: { usuario: true },
    });
    if (access?.status !== 'ATIVO' || !access.usuario.ativo) return null;
    return {
      globalUserId: access.usuario.id,
      name: access.usuario.nome,
      email: access.usuario.email.toLowerCase(),
    };
  }
}

const toMemberView = (membership: {
  usuarioId: number;
  fazendaId: number;
  role: RoleFazenda;
  ativo: boolean;
  usuario: { globalUserId: string | null; perfilId: number | null };
}): TeamMemberView => ({
  localUserId: membership.usuarioId,
  globalUserId: membership.usuario.globalUserId ?? '',
  farmId: membership.fazendaId,
  role: membership.role,
  profileId: membership.usuario.perfilId,
  active: membership.ativo,
});

const toProfileView = (profile: {
  id: number;
  fazendaId: number | null;
  nome: string;
  descricao: string | null;
  systemRole: RoleFazenda | null;
  ativo: boolean;
  permissoes: readonly { permissaoId: number }[];
}): ProfileView => ({
  id: profile.id,
  farmId: profile.fazendaId ?? 0,
  name: profile.nome,
  description: profile.descricao,
  systemRole: profile.systemRole,
  active: profile.ativo,
  permissionIds: profile.permissoes.map(({ permissaoId }) => permissaoId),
});

@Injectable()
export class PrismaTeamRepository implements TeamRepository {
  constructor(private readonly tenant: TenantPrismaService) {}

  async getSummary(farmIds: readonly number[]) {
    const client = this.tenant.getClient();
    const [farms, users, profiles, permissions] = await Promise.all([
      client.fazenda.findMany({
        where: { id: { in: [...farmIds] }, ativo: true },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true },
      }),
      client.usuario.findMany({
        where: {
          ativo: true,
          fazendas: {
            some: { fazendaId: { in: [...farmIds] }, ativo: true },
          },
        },
        orderBy: { nome: 'asc' },
        include: {
          fazendas: {
            where: { fazendaId: { in: [...farmIds] }, ativo: true },
            orderBy: { fazendaId: 'asc' },
          },
        },
      }),
      client.perfil.findMany({
        where: {
          ativo: true,
          OR: [{ fazendaId: { in: [...farmIds] } }, { fazendaId: null }],
        },
        orderBy: { nome: 'asc' },
        include: { permissoes: true },
      }),
      client.permissao.findMany({
        where: { ativo: true },
        orderBy: [{ modulo: 'asc' }, { nome: 'asc' }],
        select: { id: true, codigo: true, nome: true },
      }),
    ]);

    return {
      farms: farms.map(({ id, nome }) => ({ id, name: nome })),
      members: users.flatMap((user) => {
        const firstMembership = user.fazendas[0];
        if (!firstMembership || !user.globalUserId) return [];
        return [
          {
            localUserId: user.id,
            globalUserId: user.globalUserId,
            name: user.nome,
            email: user.email,
            farmIds: user.fazendas.map(({ fazendaId }) => fazendaId),
            role: firstMembership.role,
            profileId: user.perfilId,
            active: user.ativo,
          },
        ];
      }),
      profiles: profiles.map(toProfileView),
      permissions: permissions.map(({ id, codigo, nome }) => ({
        id,
        code: codigo,
        name: nome,
      })),
    };
  }

  async assignMembership(input: {
    user: AcceptedOrganizationUser;
    farmId: number;
    role: string;
    profileId: number | null;
  }): Promise<TeamMemberView> {
    return this.tenant.getClient().$transaction(async (transaction) => {
      const user = await transaction.usuario.upsert({
        where: { globalUserId: input.user.globalUserId },
        create: {
          globalUserId: input.user.globalUserId,
          nome: input.user.name,
          email: input.user.email,
          senhaHash: null,
          perfilId: input.profileId,
          ativo: true,
        },
        update: {
          nome: input.user.name,
          email: input.user.email,
          perfilId: input.profileId,
          ativo: true,
        },
      });
      const membership = await transaction.usuarioFazenda.upsert({
        where: {
          usuarioId_fazendaId: {
            usuarioId: user.id,
            fazendaId: input.farmId,
          },
        },
        create: {
          usuarioId: user.id,
          fazendaId: input.farmId,
          role: input.role as RoleFazenda,
          ativo: true,
        },
        update: { role: input.role as RoleFazenda, ativo: true },
        include: { usuario: true },
      });
      return toMemberView(membership);
    });
  }

  async deactivateMembership(input: {
    localUserId: number;
    farmId: number;
  }): Promise<TeamMemberView | null> {
    const client = this.tenant.getClient();
    const result = await client.usuarioFazenda.updateMany({
      where: {
        usuarioId: input.localUserId,
        fazendaId: input.farmId,
        ativo: true,
      },
      data: { ativo: false },
    });
    if (result.count === 0) return null;
    const membership = await client.usuarioFazenda.findUnique({
      where: {
        usuarioId_fazendaId: {
          usuarioId: input.localUserId,
          fazendaId: input.farmId,
        },
      },
      include: { usuario: true },
    });
    return membership ? toMemberView(membership) : null;
  }

  async findActiveRole(
    localUserId: number,
    farmId: number,
  ): Promise<string | null> {
    const membership = await this.tenant.getClient().usuarioFazenda.findFirst({
      where: { usuarioId: localUserId, fazendaId: farmId, ativo: true },
      select: { role: true },
    });
    return membership?.role ?? null;
  }

  async findByName(farmId: number, name: string): Promise<ProfileView | null> {
    const profile = await this.tenant.getClient().perfil.findFirst({
      where: {
        fazendaId: farmId,
        nome: { equals: name, mode: 'insensitive' },
        ativo: true,
      },
      include: { permissoes: true },
    });
    return profile ? toProfileView(profile) : null;
  }

  async findById(
    farmId: number,
    profileId: number,
  ): Promise<ProfileView | null> {
    const profile = await this.tenant.getClient().perfil.findFirst({
      where: {
        id: profileId,
        OR: [{ fazendaId: farmId }, { fazendaId: null }],
        ativo: true,
      },
      include: { permissoes: true },
    });
    return profile ? toProfileView(profile) : null;
  }

  async findActivePermissionIds(
    ids: readonly number[],
  ): Promise<readonly number[]> {
    const permissions = await this.tenant.getClient().permissao.findMany({
      where: { id: { in: [...ids] }, ativo: true },
      select: { id: true },
    });
    return permissions.map(({ id }) => id);
  }

  async create(input: {
    farmId: number;
    name: string;
    description: string | null;
    permissionIds: readonly number[];
  }): Promise<ProfileView> {
    return this.tenant.getClient().$transaction(async (transaction) => {
      const profile = await transaction.perfil.create({
        data: {
          fazendaId: input.farmId,
          nome: input.name,
          descricao: input.description,
          permissoes: {
            create: input.permissionIds.map((permissaoId) => ({ permissaoId })),
          },
        },
        include: { permissoes: true },
      });
      return toProfileView(profile);
    });
  }

  async update(
    profileId: number,
    input: {
      name: string;
      description: string | null;
      permissionIds: readonly number[];
    },
  ): Promise<ProfileView> {
    return this.tenant.getClient().$transaction(async (transaction) => {
      await transaction.perfilPermissao.deleteMany({
        where: { perfilId: profileId },
      });
      const profile = await transaction.perfil.update({
        where: { id: profileId },
        data: {
          nome: input.name,
          descricao: input.description,
          permissoes: {
            create: input.permissionIds.map((permissaoId) => ({ permissaoId })),
          },
        },
        include: { permissoes: true },
      });
      return toProfileView(profile);
    });
  }
}
