import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: any): Promise<{
        id_fazendas: number[];
        user: {
            id: number;
            nome: string;
            email: string;
            admin?: undefined;
            suporte?: undefined;
            acesso_geral?: undefined;
            acesso_animais?: undefined;
            acesso_dashboard?: undefined;
            acesso_custos?: undefined;
            acesso_caixa?: undefined;
            acesso_vendas?: undefined;
            acesso_saldo?: undefined;
            acesso_manejo?: undefined;
            acesso_racas?: undefined;
            acesso_lotes?: undefined;
            acesso_pastos?: undefined;
            acesso_clientes?: undefined;
            fazenda?: undefined;
        };
        token?: undefined;
    } | {
        token: string;
        user: {
            id: number;
            nome: string;
            email: string;
            admin: boolean;
            suporte: boolean;
            acesso_geral: boolean;
            acesso_animais: boolean;
            acesso_dashboard: boolean;
            acesso_custos: boolean;
            acesso_caixa: boolean;
            acesso_vendas: boolean;
            acesso_saldo: boolean;
            acesso_manejo: boolean;
            acesso_racas: boolean;
            acesso_lotes: boolean;
            acesso_pastos: boolean;
            acesso_clientes: boolean;
            fazenda: {
                id: number;
                nome: string | null;
            };
        };
        id_fazendas?: undefined;
    }>;
    register(dto: RegisterDto): Promise<{
        id: number;
        nome: string;
        email: string;
    }>;
    googleLogin(googleUser: {
        email: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        token: string;
        user: {
            id: number;
            nome: string;
            email: string;
            admin: boolean;
            fazenda: {
                id: number;
                nome: string | null;
            } | null;
        };
    }>;
    private generateToken;
}
