export interface TenantInfo {
    tenantId: string;
    schemaName: string;
    organizacaoId: string;
    subdomain?: string;
    status: string;
    resolvedVia?: 'subdomain' | 'header' | 'jwt';
}
export declare class TenantContext {
    private static storage;
    static run<T>(tenant: TenantInfo, fn: () => T): T;
    static get(): TenantInfo | undefined;
    static getOrFail(): TenantInfo;
    static getSchemaName(): string | undefined;
    static getTenantId(): string | undefined;
}
