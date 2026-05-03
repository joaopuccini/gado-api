export interface RequestContextData {
    requestId: string;
    fazendaId?: number;
    userId?: number;
    userEmail?: string;
    path?: string;
    method?: string;
    startTime: number;
}
export declare class RequestContext {
    private static storage;
    static run(data: Partial<RequestContextData>, fn: () => void): void;
    static get(): RequestContextData | undefined;
    static getRequestId(): string;
    static getFazendaId(): number | undefined;
    static getUserId(): number | undefined;
    static set(partial: Partial<RequestContextData>): void;
}
