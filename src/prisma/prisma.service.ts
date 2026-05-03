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

    /**
     * Multi-tenancy: executa operação no schema da fazenda via SET search_path
     */
    async executeInTenantSchema<T>(
        fazendaId: number,
        operation: (prisma: PrismaClient) => Promise<T>,
    ): Promise<T> {
        const schema = `fazenda_${fazendaId}`;
        await this.$executeRawUnsafe(`SET search_path TO "${schema}", public`);
        try {
            return await operation(this);
        } finally {
            await this.$executeRawUnsafe(`SET search_path TO "gado_fazendas", public`);
        }
    }

    excludeDeleted() {
        return { excluido: false };
    }

    softDeleteData() {
        return { excluido: true, excluido_data: new Date() };
    }
}
