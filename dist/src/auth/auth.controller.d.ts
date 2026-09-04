import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
            permissoes: ("animais:ler" | "animais:criar" | "animais:editar" | "animais:excluir" | "financeiro:ler" | "financeiro:criar" | "financeiro:editar" | "financeiro:excluir" | "configuracoes:gerenciar" | "sanidade:ler" | "sanidade:criar" | "sanidade:gerenciar" | "manejo:ler" | "manejo:criar" | "manejo:gerenciar" | "pesagens:ler" | "pesagens:criar" | "dashboard:ler" | "dashboard:criar" | "dashboard:editar" | "dashboard:excluir" | "dashboard:gerenciar" | "animais:gerenciar" | "pesagens:editar" | "pesagens:excluir" | "pesagens:gerenciar" | "sanidade:editar" | "sanidade:excluir" | "manejo:editar" | "manejo:excluir" | "financeiro:gerenciar" | "pastos:ler" | "pastos:criar" | "pastos:editar" | "pastos:excluir" | "pastos:gerenciar" | "lotes:ler" | "lotes:criar" | "lotes:editar" | "lotes:excluir" | "lotes:gerenciar" | "racas:ler" | "racas:criar" | "racas:editar" | "racas:excluir" | "racas:gerenciar" | "clientes:ler" | "clientes:criar" | "clientes:editar" | "clientes:excluir" | "clientes:gerenciar" | "fotos:ler" | "fotos:criar" | "fotos:editar" | "fotos:excluir" | "fotos:gerenciar" | "movimentacoes:ler" | "movimentacoes:criar" | "movimentacoes:editar" | "movimentacoes:excluir" | "movimentacoes:gerenciar" | "configuracoes:ler" | "configuracoes:criar" | "configuracoes:editar" | "configuracoes:excluir")[];
        };
        needSelection?: undefined;
        id_fazendas?: undefined;
        fazendas?: undefined;
    }>;
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any, res: Response): Promise<void>;
}
