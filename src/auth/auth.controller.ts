import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login com email/senha' })
    @ApiResponse({ status: 200, description: 'Token JWT retornado' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Registrar novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
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
    async googleAuthRedirect(@Req() req: any) {
        return this.authService.googleLogin(req.user);
    }
}
