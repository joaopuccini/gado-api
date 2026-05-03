import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface RequestContextData {
    requestId: string;
    fazendaId?: number;
    userId?: number;
    userEmail?: string;
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

    static run(data: Partial<RequestContextData>, fn: () => void): void {
        const context: RequestContextData = {
            requestId: data.requestId || uuidv4(),
            fazendaId: data.fazendaId,
            userId: data.userId,
            userEmail: data.userEmail,
            path: data.path,
            method: data.method,
            startTime: data.startTime || Date.now(),
        };
        this.storage.run(context, fn);
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

    static getUserId(): number | undefined {
        return this.get()?.userId;
    }

    static set(partial: Partial<RequestContextData>): void {
        const current = this.get();
        if (current) {
            Object.assign(current, partial);
        }
    }
}
