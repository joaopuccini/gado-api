import 'dotenv/config';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    executeInTenantSchema<T>(fazendaId: number, operation: (prisma: PrismaClient) => Promise<T>): Promise<T>;
    excludeDeleted(): {
        excluido: boolean;
    };
    softDeleteData(): {
        excluido: boolean;
        excluido_data: Date;
    };
}
