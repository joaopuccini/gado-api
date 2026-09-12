import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7: requer Driver Adapter, não usa mais engine binária
// PrismaService estende o PrismaClient e injeta o adapter no super()
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
        super({ adapter } as any);
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
        this.logger.log('📦 Database connected');
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
        this.logger.log('📦 Database disconnected');
    }

    excludeDeleted() {
        return { excluido: false };
    }

    softDeleteData() {
        return { excluido: true, excluido_data: new Date() };
    }
}
