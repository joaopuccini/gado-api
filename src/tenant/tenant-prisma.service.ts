import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import {
  ExecutionContextStore,
  type RequiredTenantContext,
} from '../common/context';
import {
  TenantPrismaClientFactory,
  type TenantPrismaClientFactoryPort,
} from './infrastructure/tenant-prisma-client.factory';
import { TenantSchemaName } from './infrastructure/schema-name';

@Injectable()
export class TenantPrismaService {
  constructor(
    private readonly contextStore: ExecutionContextStore,
    @Inject(TenantPrismaClientFactory)
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
