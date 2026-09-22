import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { AssignMemberUseCase } from '../application/use-cases/assign-member.use-case';
import { CreateProfileUseCase } from '../application/use-cases/create-profile.use-case';
import { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';
import { AssignMemberDto } from './dto/assign-member.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import {
  TeamMemberResponseDto,
  TeamProfileResponseDto,
} from './dto/team.response';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Account Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('account/team')
export class TeamController {
  constructor(
    private readonly assignMember: AssignMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly createProfile: CreateProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Post('members')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'assignAccountTeamMember' })
  @ApiCreatedResponse({ type: TeamMemberResponseDto })
  assign(@Body() dto: AssignMemberDto) {
    return this.assignMember.execute({
      ...dto,
      profileId: dto.profileId ?? null,
    });
  }

  @Delete('members/:localUserId/farms/:farmId')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'removeAccountTeamMember' })
  @ApiOkResponse({ type: TeamMemberResponseDto })
  remove(
    @Param('localUserId', ParseIntPipe) localUserId: number,
    @Param('farmId', ParseIntPipe) farmId: number,
  ) {
    return this.removeMember.execute({ localUserId, farmId });
  }

  @Post('profiles')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'createAccountTeamProfile' })
  @ApiCreatedResponse({ type: TeamProfileResponseDto })
  createCustomProfile(@Body() dto: CreateProfileDto) {
    return this.createProfile.execute({
      ...dto,
      description: dto.description ?? null,
    });
  }

  @Patch('profiles/:profileId')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'updateAccountTeamProfile' })
  @ApiOkResponse({ type: TeamProfileResponseDto })
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
