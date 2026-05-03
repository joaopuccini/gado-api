import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/context';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: any) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.usuario.findUnique({
            where: { email },
        });

        if (!user || user.excluido || user.inativo) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        // Se a senha for enviada, valida ela (Login inicial)
        if (dto.password) {
            const passwordValid = await bcrypt.compare(dto.password, user.password);
            if (!passwordValid) {
                throw new UnauthorizedException('Credenciais inválidas');
            }
        }

        // Buscar fazendas vinculadas
        const allFazendas = await this.prisma.fazenda.findMany({
            where: {
                id_usuarios: { has: user.id },
                excluido: false,
                status: 'ATIVO',
            },
        });

        if (allFazendas.length === 0) {
            throw new UnauthorizedException('Usuário não vinculado a nenhuma fazenda ativa');
        }

        // Se um ID de fazenda específico foi solicitado
        const requestedFazendaId = dto.id_fazenda || dto.fazendaId;
        const selectedFazenda = requestedFazendaId 
            ? allFazendas.find(f => f.id === Number(requestedFazendaId))
            : allFazendas[0];

        if (!selectedFazenda) {
            throw new UnauthorizedException('Acesso negado ou fazenda não encontrada');
        }

        // Se o front-end está esperando a lista de fazendas (fluxo de seleção)
        // O legado espera { id_fazendas: number[], user: any } no /logar
        if (!requestedFazendaId && allFazendas.length > 1 && dto.password) {
            return {
                id_fazendas: allFazendas.map(f => f.id),
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                }
            };
        }

        const token = this.generateToken(user, selectedFazenda.id);

        return {
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                admin: user.admin,
                suporte: user.suporte,
                acesso_geral: user.acesso_geral,
                acesso_animais: user.acesso_animais,
                acesso_dashboard: user.acesso_dashboard,
                acesso_custos: user.acesso_custos,
                acesso_caixa: user.acesso_caixa,
                acesso_vendas: user.acesso_vendas,
                acesso_saldo: user.acesso_saldo,
                acesso_manejo: user.acesso_manejo,
                acesso_racas: user.acesso_racas,
                acesso_lotes: user.acesso_lotes,
                acesso_pastos: user.acesso_pastos,
                acesso_clientes: user.acesso_clientes,
                fazenda: {
                    id: selectedFazenda.id,
                    nome: selectedFazenda.nome,
                },
            },
        };
    }

    async register(dto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.usuario.create({
            data: {
                ...dto,
                password: hashedPassword,
            },
        });

        this.logger.log(`Novo usuário registrado: ${user.email}`);

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
        };
    }

    /**
     * Handles Google OAuth callback.
     * Creates user if not exists, links to fazenda, returns JWT.
     */
    async googleLogin(googleUser: { email: string; firstName: string; lastName: string }) {
        let user = await this.prisma.usuario.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            // Auto-create user from Google profile
            user = await this.prisma.usuario.create({
                data: {
                    nome: `${googleUser.firstName} ${googleUser.lastName}`,
                    email: googleUser.email,
                    password: '', // No password for OAuth users
                    acesso_geral: true,
                },
            });
            this.logger.log(`Google OAuth: novo usuário criado: ${user.email}`);
        }

        if (user.excluido || user.inativo) {
            throw new UnauthorizedException('Conta desativada');
        }

        const fazenda = await this.prisma.fazenda.findFirst({
            where: {
                id_usuarios: { has: user.id },
                excluido: false,
            },
        });

        const token = this.generateToken(user, fazenda?.id);

        return {
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                admin: user.admin,
                fazenda: fazenda ? { id: fazenda.id, nome: fazenda.nome } : null,
            },
        };
    }

    private generateToken(user: any, fazendaId?: number): string {
        const payload = {
            sub: user.id,
            email: user.email,
            nome: user.nome,
            admin: user.admin,
            suporte: user.suporte,
            fazendaId,
            permissoes: {
                acesso_geral: user.acesso_geral,
                acesso_animais: user.acesso_animais,
                acesso_dashboard: user.acesso_dashboard,
                acesso_custos: user.acesso_custos,
                acesso_caixa: user.acesso_caixa,
                acesso_vendas: user.acesso_vendas,
                acesso_saldo: user.acesso_saldo,
                acesso_manejo: user.acesso_manejo,
                acesso_racas: user.acesso_racas,
                acesso_lotes: user.acesso_lotes,
                acesso_pastos: user.acesso_pastos,
                acesso_clientes: user.acesso_clientes,
            },
        };

        return this.jwtService.sign(payload);
    }
}
