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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsuariosService = void 0;
const common_1 = require("@nestjs/common");
const admin_prisma_service_1 = require("../admin-prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
let AdminUsuariosService = class AdminUsuariosService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async create(createAdminUserDto) {
        const existing = await this.prisma.adminUser.findUnique({
            where: { email: createAdminUserDto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('E-mail já está em uso por outro administrador');
        }
        const hashedPassword = await bcrypt.hash(createAdminUserDto.senha, 10);
        const newUser = await this.prisma.adminUser.create({
            data: {
                nome: createAdminUserDto.nome,
                email: createAdminUserDto.email,
                senhaHash: hashedPassword,
                role: createAdminUserDto.role || 'SUPPORT',
            },
        });
        const { senhaHash, ...result } = newUser;
        return result;
    }
    async findAll() {
        return await this.prisma.adminUser.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const user = await this.prisma.adminUser.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException(`AdminUser #${id} não encontrado`);
        return user;
    }
    async update(id, updateAdminUserDto) {
        const data = { ...updateAdminUserDto };
        if (updateAdminUserDto.senha) {
            data.senhaHash = await bcrypt.hash(updateAdminUserDto.senha, 10);
            delete data.senha;
        }
        try {
            const updated = await this.prisma.adminUser.update({
                where: { id },
                data,
            });
            const { senhaHash, ...result } = updated;
            return result;
        }
        catch (e) {
            throw new common_1.NotFoundException(`AdminUser #${id} não encontrado`);
        }
    }
    async remove(id) {
        try {
            return await this.prisma.adminUser.update({
                where: { id },
                data: { ativo: false },
            });
        }
        catch (e) {
            throw new common_1.NotFoundException(`AdminUser #${id} não encontrado`);
        }
    }
    async login(email, senhaPlana) {
        const user = await this.prisma.adminUser.findUnique({ where: { email } });
        if (!user || !user.ativo) {
            throw new common_1.UnauthorizedException('Credenciais inválidas ou usuário inativo');
        }
        const isMatch = await bcrypt.compare(senhaPlana, user.senhaHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const payload = { sub: user.id, email: user.email, role: user.role, isAdmin: true };
        const token = this.jwtService.sign(payload);
        const { senhaHash, ...result } = user;
        return {
            user: result,
            token,
        };
    }
};
exports.AdminUsuariosService = AdminUsuariosService;
exports.AdminUsuariosService = AdminUsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_prisma_service_1.AdminPrismaService,
        jwt_1.JwtService])
], AdminUsuariosService);
//# sourceMappingURL=admin-usuarios.service.js.map