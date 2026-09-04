import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as AdminPrismaClient } from '@prisma/client-admin';
export declare class AdminPrismaService extends AdminPrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
