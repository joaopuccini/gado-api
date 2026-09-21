import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiErrorDto } from '../common/contracts/api-error.dto';
import { GetProvisioningStatusUseCase } from '../tenant-provisioning/application/use-cases/get-provisioning-status.use-case';
import { StartTenantOnboardingUseCase } from '../tenant-provisioning/application/use-cases/start-tenant-onboarding.use-case';
import { StartOnboardingDto } from '../tenant-provisioning/presentation/dto/start-onboarding.dto';
import {
  ProvisioningAcceptedResponseDto,
  ProvisioningStatusResponseDto,
} from '../tenant-provisioning/presentation/dto/provisioning-status.response';
import { ProvisioningCredentialService } from './services/provisioning-credential.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly startTenantOnboarding: StartTenantOnboardingUseCase,
    private readonly getProvisioningStatus: GetProvisioningStatusUseCase,
    private readonly provisioningCredential: ProvisioningCredentialService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Iniciar provisionamento de uma conta por e-mail' })
  @ApiAcceptedResponse({ type: ProvisioningAcceptedResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiInternalServerErrorResponse({ type: ApiErrorDto })
  async register(
    @Body() dto: StartOnboardingDto,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const started = await this.startTenantOnboarding.execute({
      provider: 'email',
      ownerName: dto.nome,
      ownerEmail: dto.email,
      password: dto.password,
      farmName: dto.farmName,
    });
    this.attachProvisioningCredential(
      response,
      started.globalUserId,
      started.provisioningRunId,
    );
    return {
      provisioningRunId: started.provisioningRunId,
      state: started.state,
      statusUrl: started.statusUrl,
    };
  }

  @Get('provisioning/:runId')
  @UseGuards(AuthGuard('provisioning-jwt'))
  @ApiOperation({ summary: 'Consultar o estado público do provisionamento' })
  @ApiOkResponse({ type: ProvisioningStatusResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  @ApiInternalServerErrorResponse({ type: ApiErrorDto })
  async provisioningStatus(
    @Param('runId', new ParseUUIDPipe()) runId: string,
    @Req()
    request:
      | Request
      | { readonly sub: string; readonly purpose: 'provisioning' },
  ) {
    const globalUserId =
      'sub' in request
        ? request.sub
        : (request.user as { readonly sub: string }).sub;
    return this.getProvisioningStatus.execute(runId, globalUserId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email/senha ou Seleção de Tenant' })
  @ApiResponse({ status: 200, description: 'Token JWT retornado' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    // Se for seleção de tenant (sem senha), precisa passar um token provisório
    // Para simplificar, o login() no serviço vai lidar com a lógica
    return this.authService.login(dto);
  }

  // ─── Google OAuth ─────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar login com Google' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  async googleAuthRedirect(
    @Req()
    req: Request & {
      user: {
        readonly email: string;
        readonly nome: string;
        readonly googleId: string;
        readonly fotoUrl?: string;
      };
    },
    @Res() res: Response,
  ) {
    try {
      const result = await this.startTenantOnboarding.execute({
        provider: 'google',
        ownerEmail: req.user.email,
        ownerName: req.user.nome,
        providerUserId: req.user.googleId,
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      this.attachProvisioningCredential(
        res,
        result.globalUserId,
        result.provisioningRunId,
      );
      return res.redirect(`${frontendUrl}${result.statusUrl}`);
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  private attachProvisioningCredential(
    response: Response | undefined,
    globalUserId: string | undefined,
    provisioningRunId: string,
  ): void {
    if (!response || !globalUserId || typeof response.cookie !== 'function')
      return;
    response.cookie(
      'gado_provisioning',
      this.provisioningCredential.issue(globalUserId, provisioningRunId),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
        path: '/auth/provisioning',
      },
    );
  }
}
