import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../common/context';
import { TenantModule } from '../tenant/tenant.module';
import { FarmsModule } from './farms/farms.module';
import { GetOrganizationAccountUseCase } from './organization/application/use-cases/get-organization-account.use-case';
import {
  ORGANIZATION_ACCOUNT_REPOSITORY,
  type OrganizationAccountRepository,
} from './organization/application/ports/organization-account.repository';
import { PrismaOrganizationAccountRepository } from './organization/infrastructure/prisma-organization-account.repository';
import { OrganizationController } from './organization/presentation/organization.controller';
import { GetSubscriptionSummaryUseCase } from './subscription/application/use-cases/get-subscription-summary.use-case';
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from './subscription/application/ports/subscription.repository';
import { PrismaSubscriptionRepository } from './subscription/infrastructure/prisma-subscription.repository';
import { SubscriptionController } from './subscription/presentation/subscription.controller';
import { TeamModule } from './team/team.module';

@Module({
  imports: [AdminModule, AuthModule, TenantModule, FarmsModule, TeamModule],
  controllers: [OrganizationController, SubscriptionController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaOrganizationAccountRepository,
    PrismaSubscriptionRepository,
    {
      provide: ORGANIZATION_ACCOUNT_REPOSITORY,
      useExisting: PrismaOrganizationAccountRepository,
    },
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useExisting: PrismaSubscriptionRepository,
    },
    {
      provide: GetOrganizationAccountUseCase,
      useFactory: (
        organizations: OrganizationAccountRepository,
        context: ExecutionContextStore,
      ) => new GetOrganizationAccountUseCase(organizations, context),
      inject: [ORGANIZATION_ACCOUNT_REPOSITORY, ExecutionContextStore],
    },
    {
      provide: GetSubscriptionSummaryUseCase,
      useFactory: (
        subscriptions: SubscriptionRepository,
        context: ExecutionContextStore,
      ) => new GetSubscriptionSummaryUseCase(subscriptions, context),
      inject: [SUBSCRIPTION_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class AccountModule {}
