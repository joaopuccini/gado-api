import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionContextStore } from '../common/context';
import { StructuredLogger } from '../common/logger/structured-logger.service';
import {
  TENANT_PRISMA_CLIENT_FACTORY,
  type TenantPrismaClientFactoryPort,
} from '../tenant/application/ports/tenant-prisma-client-factory.port';
import {
  DEFAULT_PROFILE_REPOSITORY,
  type DefaultProfileRepository,
} from './application/ports/default-profile.repository';
import {
  PERMISSION_CATALOG_REPOSITORY,
  type PermissionCatalogRepository,
} from './application/ports/permission-catalog.repository';
import {
  TENANT_MIGRATION_REPOSITORY,
  TENANT_MIGRATION_SOURCE,
  type TenantMigrationRepository,
  type TenantMigrationSource,
} from './application/ports/tenant-migration.repository';
import { MigrateTenantSchemaUseCase } from './application/use-cases/migrate-tenant-schema.use-case';
import { ProvisionSchemaUseCase } from './application/use-cases/provision-schema.use-case';
import { SeedProfilesService } from './application/services/seed-profiles.service';
import { SyncPermissionsService } from './application/services/sync-permissions.service';
import { PrismaDefaultProfileRepository } from './infrastructure/persistence/prisma/prisma-default-profile.repository';
import { PrismaPermissionCatalogRepository } from './infrastructure/persistence/prisma/prisma-permission-catalog.repository';
import { PostgresTenantMigrationRepository } from './infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from './infrastructure/tenant-migration.loader';

@Module({
  providers: [
    StructuredLogger,
    TenantMigrationLoader,
    {
      provide: DEFAULT_PROFILE_REPOSITORY,
      useFactory: (
        context: ExecutionContextStore,
        clientFactory: TenantPrismaClientFactoryPort,
      ): DefaultProfileRepository =>
        new PrismaDefaultProfileRepository(context, clientFactory),
      inject: [ExecutionContextStore, TENANT_PRISMA_CLIENT_FACTORY],
    },
    {
      provide: SeedProfilesService,
      useFactory: (repository: DefaultProfileRepository): SeedProfilesService =>
        new SeedProfilesService(repository),
      inject: [DEFAULT_PROFILE_REPOSITORY],
    },
    {
      provide: PERMISSION_CATALOG_REPOSITORY,
      useFactory: (
        context: ExecutionContextStore,
        clientFactory: TenantPrismaClientFactoryPort,
      ): PermissionCatalogRepository =>
        new PrismaPermissionCatalogRepository(context, clientFactory),
      inject: [ExecutionContextStore, TENANT_PRISMA_CLIENT_FACTORY],
    },
    {
      provide: SyncPermissionsService,
      useFactory: (
        repository: PermissionCatalogRepository,
      ): SyncPermissionsService => new SyncPermissionsService(repository),
      inject: [PERMISSION_CATALOG_REPOSITORY],
    },
    {
      provide: TENANT_MIGRATION_SOURCE,
      useExisting: TenantMigrationLoader,
    },
    {
      provide: TENANT_MIGRATION_REPOSITORY,
      useFactory: (
        config: ConfigService,
        logger: StructuredLogger,
      ): TenantMigrationRepository =>
        new PostgresTenantMigrationRepository(
          () => config.getOrThrow<string>('DATABASE_URL'),
          logger,
        ),
      inject: [ConfigService, StructuredLogger],
    },
    {
      provide: MigrateTenantSchemaUseCase,
      useFactory: (
        context: ExecutionContextStore,
        repository: TenantMigrationRepository,
        source: TenantMigrationSource,
      ): MigrateTenantSchemaUseCase =>
        new MigrateTenantSchemaUseCase(context, repository, source),
      inject: [
        ExecutionContextStore,
        TENANT_MIGRATION_REPOSITORY,
        TENANT_MIGRATION_SOURCE,
      ],
    },
    {
      provide: ProvisionSchemaUseCase,
      useFactory: (
        context: ExecutionContextStore,
        migrateTenantSchema: MigrateTenantSchemaUseCase,
      ): ProvisionSchemaUseCase =>
        new ProvisionSchemaUseCase(context, migrateTenantSchema),
      inject: [ExecutionContextStore, MigrateTenantSchemaUseCase],
    },
  ],
  exports: [
    MigrateTenantSchemaUseCase,
    ProvisionSchemaUseCase,
    SeedProfilesService,
    SyncPermissionsService,
    StructuredLogger,
  ],
})
export class TenantProvisioningModule {}
