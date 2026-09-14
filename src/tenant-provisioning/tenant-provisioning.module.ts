import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionContextStore } from '../common/context';
import { StructuredLogger } from '../common/logger/structured-logger.service';
import {
  TENANT_MIGRATION_REPOSITORY,
  TENANT_MIGRATION_SOURCE,
  type TenantMigrationRepository,
  type TenantMigrationSource,
} from './application/ports/tenant-migration.repository';
import { MigrateTenantSchemaUseCase } from './application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from './infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from './infrastructure/tenant-migration.loader';

@Module({
  providers: [
    StructuredLogger,
    TenantMigrationLoader,
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
  ],
  exports: [MigrateTenantSchemaUseCase, StructuredLogger],
})
export class TenantProvisioningModule {}
