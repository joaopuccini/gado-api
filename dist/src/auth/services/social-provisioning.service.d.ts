import { ConfigService } from '@nestjs/config';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import { type TenantPrismaClientFactoryPort } from '../../tenant/application/ports/tenant-prisma-client-factory.port';
import { ExecutionContextStore } from '../../common/context';
import { StructuredLogger } from '../../common/logger/structured-logger.service';
import { MigrateTenantSchemaUseCase } from '../../tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
export interface ProvisionResult {
    organizacaoId: string;
    tenantId: string;
    schemaName: string;
    subdomain: string;
    usuarioLocalId: number;
    fazendaId: number;
    isNew: boolean;
}
export declare class SocialProvisioningService {
    private readonly adminPrisma;
    private readonly tenantClientFactory;
    private readonly configService;
    private readonly context;
    private readonly migrateTenantSchema;
    private readonly logger;
    constructor(adminPrisma: AdminPrismaService, tenantClientFactory: TenantPrismaClientFactoryPort, configService: ConfigService, context: ExecutionContextStore, migrateTenantSchema: MigrateTenantSchemaUseCase, logger: StructuredLogger);
    provisionTrial(profile: {
        email: string;
        nome: string;
        globalUserId: string;
    }): Promise<ProvisionResult>;
    private generateUniqueSlug;
    private getOrCreateTrialPlan;
    private seedDefaultFarmData;
}
