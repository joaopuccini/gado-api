export interface RequestContextData {
    requestId: string;
    globalUserId?: string;
    userId?: number;
    userEmail?: string;
    tenantId?: string;
    schemaName?: string;
    fazendaId?: number;
    accessibleFazendaIds?: number[];
    path?: string;
    method?: string;
    startTime: number;
}
export declare class RequestContext {
    private static storage;
    static run<T>(data: Partial<RequestContextData>, fn: () => T): T;
    static get(): RequestContextData | undefined;
    static getRequestId(): string;
    static getFazendaId(): number | undefined;
    static getAccessibleFazendaIds(): number[] | undefined;
    static getUserId(): number | undefined;
    static getGlobalUserId(): string | undefined;
    static getTenantId(): string | undefined;
    static getSchemaName(): string | undefined;
    static set(partial: Partial<RequestContextData>): void;
}
