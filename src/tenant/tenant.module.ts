import { Global, Module } from '@nestjs/common';
import { TENANT_PRISMA_CLIENT_FACTORY } from './application/ports/tenant-prisma-client-factory.port';
import { TenantPrismaService } from './tenant-prisma.service';
import { TenantPrismaClientFactory } from './infrastructure/tenant-prisma-client.factory';

@Global()
@Module({
  providers: [
    TenantPrismaClientFactory,
    {
      provide: TENANT_PRISMA_CLIENT_FACTORY,
      useExisting: TenantPrismaClientFactory,
    },
    TenantPrismaService,
  ],
  exports: [TENANT_PRISMA_CLIENT_FACTORY, TenantPrismaService],
})
export class TenantModule {}
