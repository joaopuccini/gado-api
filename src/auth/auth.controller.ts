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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        try {
            const result = await this.authService.googleLogin(req.user);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

            if (result.needSelection) {
                // Redireciona para o Front-end na tela de seleção
                // Idealmente enviamos um token provisório JWT
                // Para manter simples, enviamos os IDs disponíveis em base64
                const state = Buffer.from(JSON.stringify(result)).toString('base64');
                return res.redirect(`${frontendUrl}/selecionar-fazenda?state=${state}`);
            }

            // Acesso direto a uma única fazenda
            return res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
        } catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }
}
