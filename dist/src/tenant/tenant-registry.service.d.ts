export declare class TenantRegistryService {
    private readonly logger;
    private readonly adminClient;
    constructor();
    findBySubdomain(subdomain: string): Promise<({
        organizacao: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
            telefone: string | null;
            schemaName: string;
            status: import("@prisma/client-admin").$Enums.OrganizacaoStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subdomain: string;
        schemaName: string;
        status: import("@prisma/client-admin").$Enums.TenantRegistryStatus;
        organizacaoId: string;
        provisionedAt: Date | null;
    }) | null>;
    findById(id: string): Promise<({
        organizacao: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
            telefone: string | null;
            schemaName: string;
            status: import("@prisma/client-admin").$Enums.OrganizacaoStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subdomain: string;
        schemaName: string;
        status: import("@prisma/client-admin").$Enums.TenantRegistryStatus;
        organizacaoId: string;
        provisionedAt: Date | null;
    }) | null>;
    onModuleDestroy(): Promise<void>;
}
