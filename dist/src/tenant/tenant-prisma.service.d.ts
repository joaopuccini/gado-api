import { OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare let globalTenantPrismaService: TenantPrismaService | null;
export declare class TenantPrismaService implements OnModuleDestroy {
    private readonly logger;
    private readonly clients;
    private readonly MAX_CLIENTS;
    private readonly CLIENT_IDLE_MS;
    private readonly defaultClient;
    private cleanupInterval;
    constructor();
    getClient(): PrismaClient;
    getClientForSchema(schemaName: string): PrismaClient;
    private createClientForSchema;
    private evictLeastRecentlyUsed;
    private evictIdleClients;
    getPoolStats(): {
        activeClients: number;
        maxClients: number;
        schemas: string[];
    };
    onModuleDestroy(): Promise<void>;
}
