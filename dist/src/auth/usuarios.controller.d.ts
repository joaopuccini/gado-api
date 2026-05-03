import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class UsuariosController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            nome: string;
            email: string;
            admin: boolean;
            fazenda: {
                id: number;
                nome: string | null;
            };
        };
    }>;
    autenticar(dto: any): Promise<{
        token: string;
        user: {
            id: number;
            nome: string;
            email: string;
            admin: boolean;
            fazenda: {
                id: number;
                nome: string | null;
            };
        };
    }>;
    registrar(dto: RegisterDto): Promise<{
        id: number;
        nome: string;
        email: string;
    }>;
    cadastrar(dto: RegisterDto): Promise<{
        id: number;
        nome: string;
        email: string;
    }>;
}
