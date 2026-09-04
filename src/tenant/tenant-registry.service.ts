import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient as AdminPrismaClient } from '@prisma/client-admin';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class TenantRegistryService {
  private readonly logger = new Logger(TenantRegistryService.name);
  private readonly adminClient: AdminPrismaClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const pool = new Pool({
      connectionString: databaseUrl,
    });
    const adapter = new PrismaPg(pool) as any;
    
    this.adminClient = new AdminPrismaClient({
      adapter
    });
  }

  async findBySubdomain(subdomain: string) {
    try {
      return await this.adminClient.tenantRegistry.findUnique({
        where: { subdomain },
        include: { organizacao: true },
      });
    } catch (e) {
      this.logger.error(`Erro ao buscar tenant por subdomain: ${e.message}`);
      return null;
    }
  }

  async findById(id: string) {
    try {
      return await this.adminClient.tenantRegistry.findUnique({
        where: { id },
        include: { organizacao: true },
      });
    } catch (e) {
      this.logger.error(`Erro ao buscar tenant por id: ${e.message}`);
      return null;
    }
  }

  async onModuleDestroy() {
    await this.adminClient.$disconnect();
  }
}
