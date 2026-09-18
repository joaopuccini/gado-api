import { ExecutionContextStore } from '../../../../common/context';
import { FazendaRole } from '../../../../common/rbac/rbac.enums';
import type { TenantPrismaClientFactoryPort } from '../../../../tenant/application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from '../../../../tenant/domain/tenant-schema-name';
import type {
  DefaultProfilePermissions,
  DefaultProfileRepository,
} from '../../../application/ports/default-profile.repository';

export class PrismaDefaultProfileRepository
  implements DefaultProfileRepository
{
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly clientFactory: TenantPrismaClientFactoryPort,
  ) {}

  async seed(profiles: DefaultProfilePermissions): Promise<void> {
    const { schemaName } = this.context.requireTenantIdentity();
    const client = this.clientFactory.create(TenantSchemaName.parse(schemaName));

    for (const [rawRole, permissionIds] of Object.entries(profiles)) {
      const role = rawRole as FazendaRole;
      if (!permissionIds) continue;

      await client.$transaction(async (transaction) => {
        const profile = await transaction.perfil.upsert({
          where: { systemRole: role },
          create: {
            nome: role,
            descricao: `Perfil-base ${role}`,
            systemRole: role,
            ativo: true,
          },
          update: {
            nome: role,
            descricao: `Perfil-base ${role}`,
            ativo: true,
          },
        });

        await transaction.perfilPermissao.deleteMany({
          where: { perfilId: profile.id },
        });
        await transaction.perfilPermissao.createMany({
          data: permissionIds.map((permissaoId) => ({
            perfilId: profile.id,
            permissaoId,
          })),
          skipDuplicates: true,
        });
      });
    }
  }
}
