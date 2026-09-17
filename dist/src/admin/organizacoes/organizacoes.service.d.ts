import { AdminPrismaService } from '../admin-prisma.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
export declare class OrganizacoesService {
    private readonly prisma;
    constructor(prisma: AdminPrismaService);
    create(createOrganizacaoDto: CreateOrganizacaoDto): Promise<{
        tenantRegistryId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        schemaName: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        subdomain: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
    }>;
    findAll(): Promise<({
        tenantRegistry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.TenantRegistryStatus;
            organizacaoId: string;
            subdomain: string;
            provisionedAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        schemaName: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        subdomain: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
    })[]>;
    findOne(id: string): Promise<{
        tenantRegistry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.TenantRegistryStatus;
            organizacaoId: string;
            subdomain: string;
            provisionedAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        schemaName: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        subdomain: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
    }>;
    update(id: string, updateOrganizacaoDto: UpdateOrganizacaoDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        schemaName: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        subdomain: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        schemaName: string;
        status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        telefone: string | null;
        subdomain: string;
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string | null;
    }>;
}
