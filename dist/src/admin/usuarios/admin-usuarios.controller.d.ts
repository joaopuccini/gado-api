import { AdminUsuariosService } from './admin-usuarios.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
export declare class AdminUsuariosController {
    private readonly adminUsuariosService;
    constructor(adminUsuariosService: AdminUsuariosService);
    login(body: any): Promise<{
        user: {
            id: string;
            nome: string;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: import("@prisma/client-admin/client").$Enums.AdminRole;
        };
        token: string;
    }>;
    create(createAdminUserDto: CreateAdminUserDto): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        role: import("@prisma/client-admin/client").$Enums.AdminRole;
    }>;
    findAll(): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        email: string;
        role: import("@prisma/client-admin/client").$Enums.AdminRole;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        email: string;
        role: import("@prisma/client-admin/client").$Enums.AdminRole;
    }>;
    update(id: string, updateAdminUserDto: UpdateAdminUserDto): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        role: import("@prisma/client-admin/client").$Enums.AdminRole;
    }>;
    remove(id: string): Promise<{
        id: string;
        nome: string;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        senhaHash: string;
        role: import("@prisma/client-admin/client").$Enums.AdminRole;
    }>;
}
