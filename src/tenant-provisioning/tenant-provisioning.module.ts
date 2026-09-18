import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminModule } from '../admin/admin.module';
import { AdminPrismaService } from '../admin/admin-prisma.service';
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
  EMAIL_GATEWAY,
  type EmailGateway,
} from './application/ports/email.gateway';
import {
  ONBOARDING_OUTBOX_REPOSITORY,
  type OnboardingOutboxRepository,
} from './application/ports/onboarding-outbox.repository';
import {
  PERMISSION_CATALOG_REPOSITORY,
  type PermissionCatalogRepository,
} from './application/ports/permission-catalog.repository';
import {
  TENANT_BOOTSTRAP_REPOSITORY,
  type TenantBootstrapRepository,
} from './application/ports/tenant-bootstrap.repository';
import {
  TENANT_MIGRATION_REPOSITORY,
  TENANT_MIGRATION_SOURCE,
  type TenantMigrationRepository,
  type TenantMigrationSource,
} from './application/ports/tenant-migration.repository';
import {
  TENANT_SCHEMA_LIFECYCLE_REPOSITORY,
  type TenantSchemaLifecycleRepository,
} from './application/ports/tenant-schema-lifecycle.repository';
import { CreateTenantSchemaUseCase } from './application/use-cases/create-tenant-schema.use-case';
import {
  DispatchOnboardingOutboxUseCase,
  type OnboardingOutboxLogger,
} from './application/use-cases/dispatch-onboarding-outbox.use-case';
import { MigrateTenantSchemaUseCase } from './application/use-cases/migrate-tenant-schema.use-case';
import { ProvisionSchemaUseCase } from './application/use-cases/provision-schema.use-case';
import { ProvisionTenantOrchestratorUseCase } from './application/use-cases/provision-tenant-orchestrator.use-case';
import { ProvisionTenantUseCase } from './application/use-cases/provision-tenant.use-case';
import { SeedProfilesService } from './application/services/seed-profiles.service';
import { SyncPermissionsService } from './application/services/sync-permissions.service';
import { SesEmailGateway } from './infrastructure/email/ses-email.gateway';
import { PrismaDefaultProfileRepository } from './infrastructure/persistence/prisma/prisma-default-profile.repository';
import { PrismaOnboardingOutboxRepository } from './infrastructure/persistence/prisma/prisma-onboarding-outbox.repository';
import { PrismaPermissionCatalogRepository } from './infrastructure/persistence/prisma/prisma-permission-catalog.repository';
import { PrismaTenantBootstrapRepository } from './infrastructure/persistence/prisma/prisma-tenant-bootstrap.repository';
import { PostgresTenantMigrationRepository } from './infrastructure/postgres-tenant-migration.repository';
import { PostgresTenantSchemaLifecycleRepository } from './infrastructure/postgres-tenant-schema-lifecycle.repository';
import { TenantMigrationLoader } from './infrastructure/tenant-migration.loader';

@Module({
  imports: [forwardRef(() => AdminModule)],
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
      provide: ONBOARDING_OUTBOX_REPOSITORY,
      useFactory: (database: AdminPrismaService): OnboardingOutboxRepository =>
        new PrismaOnboardingOutboxRepository(database),
      inject: [AdminPrismaService],
    },
    {
      provide: EMAIL_GATEWAY,
      useFactory: (config: ConfigService): EmailGateway =>
        new SesEmailGateway(
          () => config.getOrThrow<string>('AWS_REGION'),
          () => config.getOrThrow<string>('SES_FROM_EMAIL'),
        ),
      inject: [ConfigService],
    },
    {
      provide: DispatchOnboardingOutboxUseCase,
      useFactory: (
        repository: OnboardingOutboxRepository,
        gateway: EmailGateway,
        logger: StructuredLogger,
      ): DispatchOnboardingOutboxUseCase => {
        const outboxLogger: OnboardingOutboxLogger = {
          info: (fields) =>
            logger.info('onboardingOutboxDelivered', { ...fields }),
          warn: (fields) => logger.warn('onboardingOutboxRetry', { ...fields }),
        };
        return new DispatchOnboardingOutboxUseCase(
          repository,
          gateway,
          outboxLogger,
        );
      },
      inject: [ONBOARDING_OUTBOX_REPOSITORY, EMAIL_GATEWAY, StructuredLogger],
    },
    {
      provide: TENANT_BOOTSTRAP_REPOSITORY,
      useFactory: (
        context: ExecutionContextStore,
        clientFactory: TenantPrismaClientFactoryPort,
      ): TenantBootstrapRepository =>
        new PrismaTenantBootstrapRepository(context, clientFactory),
      inject: [ExecutionContextStore, TENANT_PRISMA_CLIENT_FACTORY],
    },
    {
      provide: ProvisionTenantUseCase,
      useFactory: (
        repository: TenantBootstrapRepository,
      ): ProvisionTenantUseCase => new ProvisionTenantUseCase(repository),
      inject: [TENANT_BOOTSTRAP_REPOSITORY],
    },
    {
      provide: TENANT_MIGRATION_SOURCE,
      useExisting: TenantMigrationLoader,
    },
    {
      provide: TENANT_SCHEMA_LIFECYCLE_REPOSITORY,
      useFactory: (config: ConfigService): TenantSchemaLifecycleRepository =>
        new PostgresTenantSchemaLifecycleRepository(() =>
          config.getOrThrow<string>('DATABASE_URL'),
        ),
      inject: [ConfigService],
    },
    {
      provide: CreateTenantSchemaUseCase,
      useFactory: (
        context: ExecutionContextStore,
        repository: TenantSchemaLifecycleRepository,
      ): CreateTenantSchemaUseCase =>
        new CreateTenantSchemaUseCase(context, repository),
      inject: [ExecutionContextStore, TENANT_SCHEMA_LIFECYCLE_REPOSITORY],
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
    {
      provide: ProvisionTenantOrchestratorUseCase,
      useFactory: (
        context: ExecutionContextStore,
        createSchema: CreateTenantSchemaUseCase,
        migrateSchema: MigrateTenantSchemaUseCase,
        syncPermissions: SyncPermissionsService,
        seedProfiles: SeedProfilesService,
        provisionTenant: ProvisionTenantUseCase,
      ): ProvisionTenantOrchestratorUseCase =>
        new ProvisionTenantOrchestratorUseCase(
          context,
          createSchema,
          migrateSchema,
          syncPermissions,
          seedProfiles,
          provisionTenant,
        ),
      inject: [
        ExecutionContextStore,
        CreateTenantSchemaUseCase,
        MigrateTenantSchemaUseCase,
        SyncPermissionsService,
        SeedProfilesService,
        ProvisionTenantUseCase,
      ],
    },
  ],
  exports: [
    DispatchOnboardingOutboxUseCase,
    MigrateTenantSchemaUseCase,
    ProvisionTenantOrchestratorUseCase,
    ProvisionTenantUseCase,
    ProvisionSchemaUseCase,
    SeedProfilesService,
    SyncPermissionsService,
    StructuredLogger,
  ],
})
export class TenantProvisioningModule {}
