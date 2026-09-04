import { AdminPrismaService } from '../admin-prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AdminUsuariosService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: AdminPrismaService, jwtService: JwtService);
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
    login(email: string, senhaPlana: string): Promise<{
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
}
