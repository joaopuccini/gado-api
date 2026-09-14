import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import {
  ExecutionContextStore,
  type RequiredTenantContext,
} from '../common/context';
import {
  TENANT_PRISMA_CLIENT_FACTORY,
  type TenantPrismaClientFactoryPort,
} from './application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from './domain/tenant-schema-name';

@Injectable()
export class TenantPrismaService {
  constructor(
    private readonly contextStore: ExecutionContextStore,
    @Inject(TENANT_PRISMA_CLIENT_FACTORY)
    private readonly clientFactory: TenantPrismaClientFactoryPort,
  ) {}

  getClient(): PrismaClient {
    const context = this.contextStore.requireTenant();
    return this.clientFactory.create(
      TenantSchemaName.parse(context.schemaName),
    );
  }

  getContext(): Readonly<RequiredTenantContext> {
    return this.contextStore.requireTenant();
  }
}
