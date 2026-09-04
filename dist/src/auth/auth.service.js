"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const admin_prisma_service_1 = require("../admin/admin-prisma.service");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const social_provisioning_service_1 = require("./services/social-provisioning.service");
const rbac_config_1 = require("../common/rbac/rbac.config");
let AuthService = AuthService_1 = class AuthService {
    adminPrisma;
    tenantPrisma;
    jwtService;
    provisioningService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(adminPrisma, tenantPrisma, jwtService, provisioningService) {
        this.adminPrisma = adminPrisma;
        this.tenantPrisma = tenantPrisma;
        this.jwtService = jwtService;
        this.provisioningService = provisioningService;
    }
    async login(dto) {
        const email = dto.email.toLowerCase();
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
            throw new common_1.UnauthorizedException('Credenciais inválidas ou usuário inativo');
        }
        if (dto.password && globalUser.senhaHash) {
            const passwordValid = await bcrypt.compare(dto.password, globalUser.senhaHash);
            if (!passwordValid) {
                throw new common_1.UnauthorizedException('Credenciais inválidas');
            }
        }
        else if (dto.password && !globalUser.senhaHash) {
            throw new common_1.UnauthorizedException('Este usuário deve autenticar via Google');
        }
        return this.resolveUserAccess(globalUser, dto.id_fazenda || dto.fazendaId);
    }
    async googleLogin(googleProfile) {
        let globalUser = await this.adminPrisma.usuarioGlobal.findUnique({
            where: { email: googleProfile.email },
            include: {
                acessos: {
                    where: { status: 'ATIVO' },
                    include: { organizacao: true }
                }
            }
        });
        if (!globalUser) {
            globalUser = await this.adminPrisma.usuarioGlobal.create({
                data: {
                    nome: googleProfile.nome,
                    email: googleProfile.email,
                    googleId: googleProfile.googleId,
                    fotoUrl: googleProfile.fotoUrl,
                    authProvider: 'GOOGLE',
                    ativo: true,
                },
                include: { acessos: true }
            });
            this.logger.log(`Google OAuth: Novo UsuarioGlobal criado: ${globalUser.email}`);
            await this.provisioningService.provisionTrial({
                email: globalUser.email,
                nome: globalUser.nome,
                globalUserId: globalUser.id,
            });
            globalUser = await this.adminPrisma.usuarioGlobal.findUnique({
                where: { id: globalUser.id },
                include: {
                    acessos: {
                        where: { status: 'ATIVO' },
                        include: { organizacao: true }
                    }
                }
            });
        }
        else if (!globalUser.googleId) {
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
            throw new common_1.UnauthorizedException('Conta desativada');
        }
        return this.resolveUserAccess(globalUser);
    }
    async resolveUserAccess(globalUser, requestedFazendaId) {
        if (!globalUser.acessos || globalUser.acessos.length === 0) {
            throw new common_1.UnauthorizedException('Usuário não vinculado a nenhuma organização ativa');
        }
        let todasFazendas = [];
        for (const acesso of globalUser.acessos) {
            const org = acesso.organizacao;
            if (!org.schemaName)
                continue;
            const tenantClient = this.tenantPrisma.getClientForSchema(org.schemaName);
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
            throw new common_1.UnauthorizedException('Usuário não tem acesso a nenhuma fazenda operacional');
        }
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
        const selectedFazenda = requestedFazendaId
            ? todasFazendas.find(f => f.id === Number(requestedFazendaId))
            : todasFazendas[0];
        if (!selectedFazenda) {
            throw new common_1.ForbiddenException('Acesso negado à fazenda solicitada');
        }
        const permissoes = (0, rbac_config_1.getPermissionsForRole)(selectedFazenda.role);
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
    generateToken(globalUser, fazendaCtx, permissoes) {
        const payload = {
            sub: globalUser.id,
            email: globalUser.email,
            nome: globalUser.nome,
            tenantId: fazendaCtx.tenantId,
            schemaName: fazendaCtx.schemaName,
            usuarioLocalId: fazendaCtx.usuarioLocalId,
            fazendaId: fazendaCtx.id,
            role: fazendaCtx.role,
            permissoes,
        };
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService,
        tenant_prisma_service_1.TenantPrismaService,
        jwt_1.JwtService,
        social_provisioning_service_1.SocialProvisioningService])
], AuthService);
//# sourceMappingURL=auth.service.js.map