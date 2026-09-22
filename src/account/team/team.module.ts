import { Module } from '@nestjs/common';
import { AdminModule } from '../../admin/admin.module';
import { AuthModule } from '../../auth/auth.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  INVITATION_OUTBOX,
  INVITATION_REPOSITORY,
  type InvitationDependencies,
  type InvitationOutbox,
  type InvitationRepository,
} from './application/ports/invitation.repository';
import {
  ORGANIZATION_MEMBER_DIRECTORY,
  TEAM_REPOSITORY,
  type OrganizationMemberDirectory,
  type ProfileRepository,
  type TeamRepository,
  type TeamMembershipRepository,
} from './application/ports/team.repository';
import { AssignMemberUseCase } from './application/use-cases/assign-member.use-case';
import { CreateProfileUseCase } from './application/use-cases/create-profile.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { GetTeamSummaryUseCase } from './application/use-cases/get-team-summary.use-case';
import { InviteInvitationUseCase } from './application/use-cases/invite-invitation.use-case';
import { ResendInvitationUseCase } from './application/use-cases/resend-invitation.use-case';
import { RevokeInvitationUseCase } from './application/use-cases/revoke-invitation.use-case';
import { PrismaInvitationRepository } from './infrastructure/prisma-invitation.repository';
import {
  CryptoTokenGenerator,
  PrismaInvitationOutbox,
  Sha256TokenHasher,
  SystemClock,
} from './infrastructure/invitation-support';
import {
  PrismaOrganizationMemberDirectory,
  PrismaTeamRepository,
} from './infrastructure/prisma-team.repository';
import { TeamController } from './presentation/team.controller';

@Module({
  imports: [AdminModule, AuthModule, TenantModule],
  controllers: [TeamController],
  providers: [
    JwtAuthGuard,
    PermissionsGuard,
    PrismaTeamRepository,
    PrismaOrganizationMemberDirectory,
    PrismaInvitationRepository,
    PrismaInvitationOutbox,
    SystemClock,
    CryptoTokenGenerator,
    Sha256TokenHasher,
    { provide: TEAM_REPOSITORY, useExisting: PrismaTeamRepository },
    {
      provide: ORGANIZATION_MEMBER_DIRECTORY,
      useExisting: PrismaOrganizationMemberDirectory,
    },
    {
      provide: INVITATION_REPOSITORY,
      useExisting: PrismaInvitationRepository,
    },
    { provide: INVITATION_OUTBOX, useExisting: PrismaInvitationOutbox },
    {
      provide: GetTeamSummaryUseCase,
      useFactory: (
        teams: TeamRepository,
        invitations: InvitationRepository,
        context: ExecutionContextStore,
        clock: SystemClock,
      ) => new GetTeamSummaryUseCase(teams, invitations, context, clock),
      inject: [
        TEAM_REPOSITORY,
        INVITATION_REPOSITORY,
        ExecutionContextStore,
        SystemClock,
      ],
    },
    ...[
      InviteInvitationUseCase,
      ResendInvitationUseCase,
      RevokeInvitationUseCase,
    ].map((useCase) => ({
      provide: useCase,
      useFactory: (
        invitations: InvitationRepository,
        outbox: InvitationOutbox,
        context: ExecutionContextStore,
        clock: SystemClock,
        tokens: CryptoTokenGenerator,
        hasher: Sha256TokenHasher,
      ) =>
        new useCase({
          invitations,
          outbox,
          context,
          clock,
          tokens,
          hasher,
        } satisfies InvitationDependencies),
      inject: [
        INVITATION_REPOSITORY,
        INVITATION_OUTBOX,
        ExecutionContextStore,
        SystemClock,
        CryptoTokenGenerator,
        Sha256TokenHasher,
      ],
    })),
    {
      provide: AssignMemberUseCase,
      useFactory: (
        directory: OrganizationMemberDirectory,
        teams: TeamMembershipRepository,
        context: ExecutionContextStore,
      ) => new AssignMemberUseCase(directory, teams, context),
      inject: [
        ORGANIZATION_MEMBER_DIRECTORY,
        TEAM_REPOSITORY,
        ExecutionContextStore,
      ],
    },
    {
      provide: RemoveMemberUseCase,
      useFactory: (
        teams: TeamMembershipRepository,
        context: ExecutionContextStore,
      ) => new RemoveMemberUseCase(teams, context),
      inject: [TEAM_REPOSITORY, ExecutionContextStore],
    },
    {
      provide: CreateProfileUseCase,
      useFactory: (teams: ProfileRepository, context: ExecutionContextStore) =>
        new CreateProfileUseCase(teams, context),
      inject: [TEAM_REPOSITORY, ExecutionContextStore],
    },
    {
      provide: UpdateProfileUseCase,
      useFactory: (teams: ProfileRepository, context: ExecutionContextStore) =>
        new UpdateProfileUseCase(teams, context),
      inject: [TEAM_REPOSITORY, ExecutionContextStore],
    },
  ],
})
export class TeamModule {}
