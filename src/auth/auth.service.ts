import { Injectable, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminPrismaService } from '../admin/admin-prisma.service';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { SocialProvisioningService } from './services/social-provisioning.service';
import { getPermissionsForRole, RolePermissions, PermissionString, FazendaRole } from '../common/rbac/rbac.config';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly adminPrisma: AdminPrismaService,
        private readonly tenantPrisma: TenantPrismaService,
        private readonly jwtService: JwtService,
        private readonly provisioningService: SocialProvisioningService,
    ) { }

    /**
     * Autenticação via Email/Senha (SaaS Admin ou Operational)
     */
    async login(dto: any) {
        const email = dto.email.toLowerCase();
        
        // 1. Buscar UsuarioGlobal no banco Admin
        const globalUser = await this.adminPrisma.usuarioGlobal.findUnique({
            where: { email },
            include: {
                acessos: {
                    where: { status: 'ATIVO' },
                    include: { organizacao: true }
                }
            }
        });

        if (!globalUser || !globalUser.ativo) {
            throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
        }

        if (dto.password && globalUser.senhaHash) {
            const passwordValid = await bcrypt.compare(dto.password, globalUser.senhaHash);
            if (!passwordValid) {
                throw new UnauthorizedException('Credenciais inválidas');
            }
        } else if (dto.password && !globalUser.senhaHash) {
            throw new UnauthorizedException('Este usuário deve autenticar via Google');
        }

        return this.resolveUserAccess(globalUser, dto.id_fazenda || dto.fazendaId);
    }

    /**
     * Autenticação via Google OAuth
     */
    async googleLogin(googleProfile: { email: string; nome: string; googleId: string; fotoUrl: string }) {
        let globalUser: any = await this.adminPrisma.usuarioGlobal.findUnique({
            where: { email: googleProfile.email },
            include: {
                acessos: {
                    where: { status: 'ATIVO' },
                    include: { organizacao: true }
                }
            }
        });

        if (!globalUser) {
            // Criar novo UsuarioGlobal
            globalUser = await this.adminPrisma.usuarioGlobal.create({
                data: {
                    nome: googleProfile.nome,
                    email: googleProfile.email,
                    googleId: googleProfile.googleId,
                    fotoUrl: googleProfile.fotoUrl,
                    authProvider: 'GOOGLE',
                    ativo: true,
                },
                include: { acessos: true } // Vazio no momento da criação
            });

            this.logger.log(`Google OAuth: Novo UsuarioGlobal criado: ${globalUser.email}`);

            // Auto-provisionar Trial
            await this.provisioningService.provisionTrial({
                email: globalUser.email,
                nome: globalUser.nome,
                globalUserId: globalUser.id,
            });

            // Recarregar os acessos após provisionamento
            globalUser = await this.adminPrisma.usuarioGlobal.findUnique({
                where: { id: globalUser.id },
                include: {
                    acessos: {
                        where: { status: 'ATIVO' },
                        include: { organizacao: true }
                    }
                }
            });
        } else if (!globalUser.googleId) {
            // Ligar conta existente com Google
            await this.adminPrisma.usuarioGlobal.update({
                where: { id: globalUser.id },
                data: { 
                    googleId: googleProfile.googleId, 
                    fotoUrl: googleProfile.fotoUrl || globalUser.fotoUrl,
                    authProvider: 'GOOGLE'
                }
            });
        }

        if (!globalUser.ativo) {
            throw new UnauthorizedException('Conta desativada');
        }

        return this.resolveUserAccess(globalUser);
    }

    /**
     * Resolve o acesso do usuário global:
     * - Se não tem organizações: Erro
     * - Se tem várias e não especificou fazenda: Retorna lista de fazendas/orgs
     * - Se especificou ou só tem 1 fazenda: Retorna JWT JWT assinado
     */
    private async resolveUserAccess(globalUser: any, requestedFazendaId?: number) {
        if (!globalUser.acessos || globalUser.acessos.length === 0) {
            throw new UnauthorizedException('Usuário não vinculado a nenhuma organização ativa');
        }

        // Mapear todas as fazendas de todos os tenants que o usuário tem acesso
        let todasFazendas = [];
        
        for (const acesso of globalUser.acessos) {
            const org = acesso.organizacao;
            if (!org.schemaName) continue;

            const tenantClient = this.tenantPrisma.getClientForSchema(org.schemaName);
            
            // Buscar o usuario local
            const userLocal = await tenantClient.usuario.findFirst({
                where: { globalUserId: globalUser.id, ativo: true }
            });

            if (userLocal) {
                const fazendasDoUsuario = await tenantClient.usuarioFazenda.findMany({
                    where: { usuarioId: userLocal.id, ativo: true },
                    include: { fazenda: true }
                });

                for (const uf of fazendasDoUsuario) {
                    if (uf.fazenda.ativo) {
                        todasFazendas.push({
                            id: uf.fazenda.id,
                            nome: uf.fazenda.nome,
                            role: uf.role,
                            schemaName: org.schemaName,
                            tenantId: org.id,
                            usuarioLocalId: userLocal.id,
                        });
                    }
                }
            }
        }

        if (todasFazendas.length === 0) {
            throw new UnauthorizedException('Usuário não tem acesso a nenhuma fazenda operacional');
        }

        // Fluxo de Seleção (Multi-Tenant/Multi-Fazenda)
        if (!requestedFazendaId && todasFazendas.length > 1) {
            return {
                needSelection: true,
                id_fazendas: todasFazendas.map(f => f.id),
                fazendas: todasFazendas.map(f => ({ id: f.id, nome: f.nome })),
                user: {
                    id: globalUser.id,
                    nome: globalUser.nome,
                    email: globalUser.email,
                }
            };
        }

        // Selecionar a fazenda alvo
        const selectedFazenda = requestedFazendaId 
            ? todasFazendas.find(f => f.id === Number(requestedFazendaId))
            : todasFazendas[0];

        if (!selectedFazenda) {
            throw new ForbiddenException('Acesso negado à fazenda solicitada');
        }

        const permissoes = getPermissionsForRole(selectedFazenda.role as FazendaRole);

        const token = this.generateToken(globalUser, selectedFazenda, permissoes);

        return {
            token,
            user: {
                id: globalUser.id,
                nome: globalUser.nome,
                email: globalUser.email,
                fotoUrl: globalUser.fotoUrl,
                tenantId: selectedFazenda.tenantId,
                fazenda: {
                    id: selectedFazenda.id,
                    nome: selectedFazenda.nome,
                    role: selectedFazenda.role,
                },
                permissoes,
            },
        };
    }

    private generateToken(globalUser: any, fazendaCtx: any, permissoes: PermissionString[]): string {
        const payload = {
            sub: globalUser.id, // ID Global
            email: globalUser.email,
            nome: globalUser.nome,
            // Contexto Tenant
            tenantId: fazendaCtx.tenantId,
            schemaName: fazendaCtx.schemaName,
            usuarioLocalId: fazendaCtx.usuarioLocalId,
            fazendaId: fazendaCtx.id,
            role: fazendaCtx.role,
            permissoes, // RBAC injetado no token
        };

        return this.jwtService.sign(payload);
    }
}
