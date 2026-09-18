import { ExecutionContextStore } from '../../../../common/context';
import { FazendaRole } from '../../../../common/rbac/rbac.enums';
import type { TenantPrismaClientFactoryPort } from '../../../../tenant/application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from '../../../../tenant/domain/tenant-schema-name';
import type {
  TenantBootstrapCommand,
  TenantBootstrapRepository,
  TenantBootstrapResources,
} from '../../../application/ports/tenant-bootstrap.repository';

export class PrismaTenantBootstrapRepository implements TenantBootstrapRepository {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly clientFactory: TenantPrismaClientFactoryPort,
  ) {}

  async bootstrap(
    command: TenantBootstrapCommand,
  ): Promise<TenantBootstrapResources> {
    const client = this.tenantClient();

    return client.$transaction(async (transaction) => {
      const ownerProfile = await transaction.perfil.findUniqueOrThrow({
        where: { systemRole: FazendaRole.DONO },
        select: { id: true },
      });
      const localUser = await transaction.usuario.upsert({
        where: { globalUserId: command.globalUserId },
        create: {
          globalUserId: command.globalUserId,
          nome: command.ownerName,
          email: command.ownerEmail.trim().toLowerCase(),
          senhaHash: command.passwordHash,
          perfilId: ownerProfile.id,
          ativo: true,
        },
        update: {
          nome: command.ownerName,
          email: command.ownerEmail.trim().toLowerCase(),
          senhaHash: command.passwordHash,
          perfilId: ownerProfile.id,
          ativo: true,
        },
        select: { id: true },
      });
      const farm = await transaction.fazenda.upsert({
        where: { provisioningRunId: command.provisioningRunId },
        create: {
          provisioningRunId: command.provisioningRunId,
          nome: command.farmName,
          nomeProprietario: command.ownerName,
          ativo: true,
        },
        update: {
          nome: command.farmName,
          nomeProprietario: command.ownerName,
          ativo: true,
        },
        select: { id: true },
      });
      const userFarm = await transaction.usuarioFazenda.upsert({
        where: {
          usuarioId_fazendaId: {
            usuarioId: localUser.id,
            fazendaId: farm.id,
          },
        },
        create: {
          usuarioId: localUser.id,
          fazendaId: farm.id,
          role: FazendaRole.DONO,
          ativo: true,
        },
        update: { role: FazendaRole.DONO, ativo: true },
        select: { id: true },
      });

      return {
        localUserId: localUser.id,
        farmId: farm.id,
        userFarmId: userFarm.id,
      };
    });
  }

  async smokeCheck(resources: TenantBootstrapResources): Promise<boolean> {
    const client = this.tenantClient();
    const [user, farm, userFarm] = await client.$transaction([
      client.usuario.findUnique({
        where: { id: resources.localUserId },
        select: { id: true },
      }),
      client.fazenda.findUnique({
        where: { id: resources.farmId },
        select: { id: true },
      }),
      client.usuarioFazenda.findUnique({
        where: { id: resources.userFarmId },
        select: { id: true },
      }),
    ]);

    return (
      user?.id === resources.localUserId &&
      farm?.id === resources.farmId &&
      userFarm?.id === resources.userFarmId
    );
  }

  private tenantClient() {
    const { schemaName } = this.context.requireTenantIdentity();
    return this.clientFactory.create(TenantSchemaName.parse(schemaName));
  }
}
