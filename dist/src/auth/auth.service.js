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
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (!user || user.excluido || user.inativo) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        if (dto.password) {
            const passwordValid = await bcrypt.compare(dto.password, user.password);
            if (!passwordValid) {
                throw new common_1.UnauthorizedException('Credenciais inválidas');
            }
        }
        const allFazendas = await this.prisma.fazenda.findMany({
            where: {
                id_usuarios: { has: user.id },
                excluido: false,
                status: 'ATIVO',
            },
        });
        if (allFazendas.length === 0) {
            throw new common_1.UnauthorizedException('Usuário não vinculado a nenhuma fazenda ativa');
        }
        const requestedFazendaId = dto.id_fazenda || dto.fazendaId;
        const selectedFazenda = requestedFazendaId
            ? allFazendas.find(f => f.id === Number(requestedFazendaId))
            : allFazendas[0];
        if (!selectedFazenda) {
            throw new common_1.UnauthorizedException('Acesso negado ou fazenda não encontrada');
        }
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
    async register(dto) {
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
    async googleLogin(googleUser) {
        let user = await this.prisma.usuario.findUnique({
            where: { email: googleUser.email },
        });
        if (!user) {
            user = await this.prisma.usuario.create({
                data: {
                    nome: `${googleUser.firstName} ${googleUser.lastName}`,
                    email: googleUser.email,
                    password: '',
                    acesso_geral: true,
                },
            });
            this.logger.log(`Google OAuth: novo usuário criado: ${user.email}`);
        }
        if (user.excluido || user.inativo) {
            throw new common_1.UnauthorizedException('Conta desativada');
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
    generateToken(user, fazendaId) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map