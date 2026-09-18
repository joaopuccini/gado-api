import { ExecutionContextStore } from '../../../../common/context';
import type { PermissionEntry } from '../../../../common/rbac/permissions-catalog';
import type { TenantPrismaClientFactoryPort } from '../../../../tenant/application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from '../../../../tenant/domain/tenant-schema-name';
import type { PermissionCatalogRepository } from '../../../application/ports/permission-catalog.repository';

export class PrismaPermissionCatalogRepository implements PermissionCatalogRepository {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly clientFactory: TenantPrismaClientFactoryPort,
  ) {}

  async sync(entries: readonly PermissionEntry[]): Promise<void> {
    const { schemaName } = this.context.requireTenantIdentity();
    const client = this.clientFactory.create(
      TenantSchemaName.parse(schemaName),
    );

    await client.$transaction(
      async (transaction) => {
        for (const entry of entries) {
          await transaction.permissao.upsert({
            where: { id: entry.id },
            create: {
              id: entry.id,
              codigo: entry.code,
              nome: entry.label,
              descricao: entry.description,
              modulo: entry.module,
              categoria: entry.action,
              ativo: true,
            },
            update: {
              codigo: entry.code,
              nome: entry.label,
              descricao: entry.description,
              modulo: entry.module,
              categoria: entry.action,
              ativo: true,
            },
          });
        }
      },
      { maxWait: 60_000, timeout: 60_000 },
    );
  }
}
