import type { PrismaClient } from '@prisma/client';
import { ExecutionContextStore, type RequiredTenantContext } from '../common/context';
import { type TenantPrismaClientFactoryPort } from './application/ports/tenant-prisma-client-factory.port';
export declare class TenantPrismaService {
    private readonly contextStore;
    private readonly clientFactory;
    constructor(contextStore: ExecutionContextStore, clientFactory: TenantPrismaClientFactoryPort);
    getClient(): PrismaClient;
    getContext(): Readonly<RequiredTenantContext>;
}
