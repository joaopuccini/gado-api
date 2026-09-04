import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantInfo } from './tenant.context';
import { TenantRegistryService } from './tenant-registry.service';
declare global {
    namespace Express {
        interface Request {
            tenant?: TenantInfo;
        }
    }
}
export declare class TenantMiddleware implements NestMiddleware {
    private readonly tenantRegistry;
    private readonly configService;
    private readonly logger;
    constructor(tenantRegistry: TenantRegistryService, configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): Promise<void | null>;
    private resolveBySubdomain;
    private resolveByTenantIdHeader;
    private extractTenantFromJwt;
    private resolveByJwtTenant;
    private validateTenantStatus;
    private extractSubdomain;
}
