import { AdminPrismaService } from '../admin-prisma.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
export declare class OrganizacoesService {
    private readonly prisma;
    constructor(prisma: AdminPrismaService);
    create(createOrganizacaoDto: CreateOrganizacaoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        schemaName: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
        subdomain: string;
    }>;
    findAll(): Promise<({
        tenantRegistry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client-admin/client").$Enums.TenantRegistryStatus;
            schemaName: string;
            subdomain: string;
            provisionedAt: Date | null;
            organizacaoId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        schemaName: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
        subdomain: string;
    })[]>;
    findOne(id: string): Promise<{
        tenantRegistry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client-admin/client").$Enums.TenantRegistryStatus;
            schemaName: string;
            subdomain: string;
            provisionedAt: Date | null;
            organizacaoId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        schemaName: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
        subdomain: string;
    }>;
    update(id: string, updateOrganizacaoDto: UpdateOrganizacaoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        schemaName: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
        subdomain: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        schemaName: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
        subdomain: string;
    }>;
}
