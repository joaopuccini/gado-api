import { Module } from '@nestjs/common';
import { AdminModule } from '../../admin/admin.module';
import { AuthModule } from '../../auth/auth.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ExecutionContextStore } from '../../common/context';
import { TenantModule } from '../../tenant/tenant.module';
import {
  ORGANIZATION_MEMBER_DIRECTORY,
  TEAM_REPOSITORY,
  type OrganizationMemberDirectory,
  type ProfileRepository,
  type TeamMembershipRepository,
} from './application/ports/team.repository';
import { AssignMemberUseCase } from './application/use-cases/assign-member.use-case';
import { CreateProfileUseCase } from './application/use-cases/create-profile.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
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
    { provide: TEAM_REPOSITORY, useExisting: PrismaTeamRepository },
    {
      provide: ORGANIZATION_MEMBER_DIRECTORY,
      useExisting: PrismaOrganizationMemberDirectory,
    },
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
