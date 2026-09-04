import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContextData {
    requestId: string;
    globalUserId?: string;
    userId?: number; // Tenant local user id
    userEmail?: string;
    tenantId?: string;
    schemaName?: string;
    fazendaId?: number;
    accessibleFazendaIds?: number[];
    path?: string;
    method?: string;
    startTime: number;
}

/**
 * AsyncLocalStorage-based request context.
 * Isolates request data per async execution — zero race conditions.
 * Each request has its own isolated storage, even under concurrency.
 */
export class RequestContext {
    private static storage = new AsyncLocalStorage<RequestContextData>();

    static run<T>(data: Partial<RequestContextData>, fn: () => T): T {
        const context: RequestContextData = {
            requestId: data.requestId || uuidv4(),
            globalUserId: data.globalUserId,
            userId: data.userId,
            userEmail: data.userEmail,
            tenantId: data.tenantId,
            schemaName: data.schemaName,
            fazendaId: data.fazendaId,
            accessibleFazendaIds: data.accessibleFazendaIds,
            path: data.path,
            method: data.method,
            startTime: data.startTime || Date.now(),
        };
        return this.storage.run(context, fn);
    }

    static get(): RequestContextData | undefined {
        return this.storage.getStore();
    }

    static getRequestId(): string {
        return this.get()?.requestId || 'no-request-id';
    }

    static getFazendaId(): number | undefined {
        return this.get()?.fazendaId;
    }

    static getAccessibleFazendaIds(): number[] | undefined {
        return this.get()?.accessibleFazendaIds;
    }

    static getUserId(): number | undefined {
        return this.get()?.userId;
    }

    static getGlobalUserId(): string | undefined {
        return this.get()?.globalUserId;
    }

    static getTenantId(): string | undefined {
        return this.get()?.tenantId;
    }

    static getSchemaName(): string | undefined {
        return this.get()?.schemaName;
    }

    static set(partial: Partial<RequestContextData>): void {
        const current = this.get();
        if (current) {
            Object.assign(current, partial);
        }
    }
}
