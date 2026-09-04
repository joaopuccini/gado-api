import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPrismaService } from '../../admin/admin-prisma.service';
export declare class SubscriptionGuard implements CanActivate {
    private reflector;
    private adminPrisma;
    constructor(reflector: Reflector, adminPrisma: AdminPrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
