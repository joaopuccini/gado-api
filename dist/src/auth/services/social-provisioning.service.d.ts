import { ConfigService } from '@nestjs/config';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
import { TenantPrismaService } from '../../tenant/tenant-prisma.service';
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
    private readonly tenantPrisma;
    private readonly configService;
    private readonly logger;
    constructor(adminPrisma: AdminPrismaService, tenantPrisma: TenantPrismaService, configService: ConfigService);
    provisionTrial(profile: {
        email: string;
        nome: string;
        globalUserId: string;
    }): Promise<ProvisionResult>;
    private generateUniqueSlug;
    private getOrCreateTrialPlan;
    private createTenantSchema;
    private seedDefaultPermissions;
    private seedDefaultProfiles;
    private seedDefaultFarmData;
}
