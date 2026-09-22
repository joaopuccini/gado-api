import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { AssignMemberUseCase } from '../application/use-cases/assign-member.use-case';
import { CreateProfileUseCase } from '../application/use-cases/create-profile.use-case';
import { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';
import { GetTeamSummaryUseCase } from '../application/use-cases/get-team-summary.use-case';
import { InviteInvitationUseCase } from '../application/use-cases/invite-invitation.use-case';
import { ResendInvitationUseCase } from '../application/use-cases/resend-invitation.use-case';
import { RevokeInvitationUseCase } from '../application/use-cases/revoke-invitation.use-case';
import { AssignMemberDto } from './dto/assign-member.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import {
  TeamInvitationResponseDto,
  TeamMemberResponseDto,
  TeamProfileResponseDto,
  TeamSummaryResponseDto,
} from './dto/team.response';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiAccountResponse } from '../../presentation/account-api-response.decorator';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('account/team')
export class TeamController {
  constructor(
    private readonly assignMember: AssignMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly createProfile: CreateProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly getSummary: GetTeamSummaryUseCase,
    private readonly inviteInvitation: InviteInvitationUseCase,
    private readonly resendInvitation: ResendInvitationUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
  ) {}

  @Get()
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({
    operationId: 'getAccountTeamSummary',
    summary: 'Consultar equipe, convites e perfis',
  })
  @ApiAccountResponse({ type: TeamSummaryResponseDto })
  summary() {
    return this.getSummary.execute();
  }

  @Post('invitations')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'inviteAccountTeamMember',
    summary: 'Convidar membro para a organização',
  })
  @ApiAccountResponse({
    type: TeamInvitationResponseDto,
    created: true,
    acceptsInput: true,
  })
  async invite(@Body() dto: InviteMemberDto) {
    return this.safeInvitation(await this.inviteInvitation.execute(dto));
  }

  @Post('invitations/:invitationId/resend')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'resendAccountTeamInvitation',
    summary: 'Reenviar convite pendente',
  })
  @ApiAccountResponse({
    type: TeamInvitationResponseDto,
    acceptsInput: true,
  })
  async resend(@Param('invitationId') invitationId: string) {
    return this.safeInvitation(
      await this.resendInvitation.execute({ invitationId }),
    );
  }

  @Delete('invitations/:invitationId')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'revokeAccountTeamInvitation',
    summary: 'Revogar convite pendente',
  })
  @ApiAccountResponse({ type: TeamInvitationResponseDto })
  async revoke(@Param('invitationId') invitationId: string) {
    return this.safeInvitation(
      await this.revokeInvitation.execute({ invitationId }),
    );
  }

  private safeInvitation(invitation: {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: Date;
  }) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  @Post('members')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'assignAccountTeamMember',
    summary: 'Vincular membro a uma fazenda',
  })
  @ApiAccountResponse({
    type: TeamMemberResponseDto,
    created: true,
    acceptsInput: true,
  })
  assign(@Body() dto: AssignMemberDto) {
    return this.assignMember.execute({
      ...dto,
      profileId: dto.profileId ?? null,
    });
  }

  @Delete('members/:localUserId/farms/:farmId')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'removeAccountTeamMember',
    summary: 'Remover membro de uma fazenda',
  })
  @ApiAccountResponse({ type: TeamMemberResponseDto })
  remove(
    @Param('localUserId', ParseIntPipe) localUserId: number,
    @Param('farmId', ParseIntPipe) farmId: number,
  ) {
    return this.removeMember.execute({ localUserId, farmId });
  }

  @Post('profiles')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'createAccountTeamProfile',
    summary: 'Criar perfil personalizado',
  })
  @ApiAccountResponse({
    type: TeamProfileResponseDto,
    created: true,
    acceptsInput: true,
  })
  createCustomProfile(@Body() dto: CreateProfileDto) {
    return this.createProfile.execute({
      ...dto,
      description: dto.description ?? null,
    });
  }

  @Patch('profiles/:profileId')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'updateAccountTeamProfile',
    summary: 'Atualizar perfil personalizado',
  })
  @ApiAccountResponse({ type: TeamProfileResponseDto, acceptsInput: true })
  updateCustomProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfile.execute({
      profileId,
      ...dto,
      description: dto.description ?? null,
    });
  }
}
