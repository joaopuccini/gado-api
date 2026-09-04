import { AdminRole } from '@prisma/client-admin';
export declare class CreateAdminUserDto {
    nome: string;
    email: string;
    senha: string;
    role?: AdminRole;
}
