import type { Prisma, PrismaClient } from '@prisma/client';
import type { TenantSchemaName } from '../../domain/tenant-schema-name';

export type QueryObservablePrismaClient = PrismaClient<
  Prisma.PrismaClientOptions,
  'query'
>;

export interface TenantPrismaClientFactoryPort {
  create(schemaName: TenantSchemaName): QueryObservablePrismaClient;
  dispose(schemaName: TenantSchemaName): Promise<void>;
}

export const TENANT_PRISMA_CLIENT_FACTORY = Symbol(
  'TENANT_PRISMA_CLIENT_FACTORY',
);
