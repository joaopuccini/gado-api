import { JwtService } from '@nestjs/jwt';
import { AdminPrismaService } from '../admin/admin-prisma.service';
import { type TenantPrismaClientFactoryPort } from '../tenant/application/ports/tenant-prisma-client-factory.port';
import { SocialProvisioningService } from './services/social-provisioning.service';
export declare class AuthService {
    private readonly adminPrisma;
    private readonly tenantClientFactory;
    private readonly jwtService;
    private readonly provisioningService;
    private readonly logger;
    constructor(adminPrisma: AdminPrismaService, tenantClientFactory: TenantPrismaClientFactoryPort, jwtService: JwtService, provisioningService: SocialProvisioningService);
    login(dto: any): Promise<{
        needSelection: boolean;
        id_fazendas: number[];
        fazendas: {
            id: number;
            nome: string;
        }[];
        user: {
            id: any;
            nome: any;
            email: any;
            fotoUrl?: undefined;
            tenantId?: undefined;
            fazenda?: undefined;
            permissoes?: undefined;
        };
        token?: undefined;
    } | {
        token: string;
        user: {
            id: any;
            nome: any;
            email: any;
            fotoUrl: any;
            tenantId: any;
            fazenda: {
                id: number;
                nome: string;
                role: import("@prisma/client").$Enums.RoleFazenda;
            };
            permissoes: ("dashboard:ler" | "dashboard:criar" | "dashboard:editar" | "dashboard:excluir" | "dashboard:gerenciar" | "animais:ler" | "animais:criar" | "animais:editar" | "animais:excluir" | "animais:gerenciar" | "pesagens:ler" | "pesagens:criar" | "pesagens:editar" | "pesagens:excluir" | "pesagens:gerenciar" | "sanidade:ler" | "sanidade:criar" | "sanidade:editar" | "sanidade:excluir" | "sanidade:gerenciar" | "manejo:ler" | "manejo:criar" | "manejo:editar" | "manejo:excluir" | "manejo:gerenciar" | "financeiro:ler" | "financeiro:criar" | "financeiro:editar" | "financeiro:excluir" | "financeiro:gerenciar" | "pastos:ler" | "pastos:criar" | "pastos:editar" | "pastos:excluir" | "pastos:gerenciar" | "lotes:ler" | "lotes:criar" | "lotes:editar" | "lotes:excluir" | "lotes:gerenciar" | "racas:ler" | "racas:criar" | "racas:editar" | "racas:excluir" | "racas:gerenciar" | "clientes:ler" | "clientes:criar" | "clientes:editar" | "clientes:excluir" | "clientes:gerenciar" | "fotos:ler" | "fotos:criar" | "fotos:editar" | "fotos:excluir" | "fotos:gerenciar" | "movimentacoes:ler" | "movimentacoes:criar" | "movimentacoes:editar" | "movimentacoes:excluir" | "movimentacoes:gerenciar" | "configuracoes:ler" | "configuracoes:criar" | "configuracoes:editar" | "configuracoes:excluir" | "configuracoes:gerenciar")[];
        };
        needSelection?: undefined;
        id_fazendas?: undefined;
        fazendas?: undefined;
    }>;
    googleLogin(googleProfile: {
        email: string;
        nome: string;
        googleId: string;
        fotoUrl: string;
    }): Promise<{
        needSelection: boolean;
        id_fazendas: number[];
        fazendas: {
            id: number;
            nome: string;
        }[];
        user: {
            id: any;
            nome: any;
            email: any;
            fotoUrl?: undefined;
            tenantId?: undefined;
            fazenda?: undefined;
            permissoes?: undefined;
        };
        token?: undefined;
    } | {
        token: string;
        user: {
            id: any;
            nome: any;
            email: any;
            fotoUrl: any;
            tenantId: any;
            fazenda: {
                id: number;
                nome: string;
                role: import("@prisma/client").$Enums.RoleFazenda;
            };
            permissoes: ("dashboard:ler" | "dashboard:criar" | "dashboard:editar" | "dashboard:excluir" | "dashboard:gerenciar" | "animais:ler" | "animais:criar" | "animais:editar" | "animais:excluir" | "animais:gerenciar" | "pesagens:ler" | "pesagens:criar" | "pesagens:editar" | "pesagens:excluir" | "pesagens:gerenciar" | "sanidade:ler" | "sanidade:criar" | "sanidade:editar" | "sanidade:excluir" | "sanidade:gerenciar" | "manejo:ler" | "manejo:criar" | "manejo:editar" | "manejo:excluir" | "manejo:gerenciar" | "financeiro:ler" | "financeiro:criar" | "financeiro:editar" | "financeiro:excluir" | "financeiro:gerenciar" | "pastos:ler" | "pastos:criar" | "pastos:editar" | "pastos:excluir" | "pastos:gerenciar" | "lotes:ler" | "lotes:criar" | "lotes:editar" | "lotes:excluir" | "lotes:gerenciar" | "racas:ler" | "racas:criar" | "racas:editar" | "racas:excluir" | "racas:gerenciar" | "clientes:ler" | "clientes:criar" | "clientes:editar" | "clientes:excluir" | "clientes:gerenciar" | "fotos:ler" | "fotos:criar" | "fotos:editar" | "fotos:excluir" | "fotos:gerenciar" | "movimentacoes:ler" | "movimentacoes:criar" | "movimentacoes:editar" | "movimentacoes:excluir" | "movimentacoes:gerenciar" | "configuracoes:ler" | "configuracoes:criar" | "configuracoes:editar" | "configuracoes:excluir" | "configuracoes:gerenciar")[];
        };
        needSelection?: undefined;
        id_fazendas?: undefined;
        fazendas?: undefined;
    }>;
    private resolveUserAccess;
    private generateToken;
}
