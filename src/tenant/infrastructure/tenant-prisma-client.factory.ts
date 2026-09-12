import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { TenantSchemaName } from './schema-name';

export type QueryObservablePrismaClient = PrismaClient<
  Prisma.PrismaClientOptions,
  'query'
>;

export interface TenantPrismaClientFactoryPort {
  create(schemaName: TenantSchemaName): Promise<QueryObservablePrismaClient>;
  dispose(schemaName: TenantSchemaName): Promise<void>;
}

@Injectable()
export class TenantPrismaClientFactory
  implements TenantPrismaClientFactoryPort, OnModuleDestroy
{
  private readonly clients = new Map<string, QueryObservablePrismaClient>();

  constructor(private readonly configService: ConfigService) {}

  async create(
    schemaName: TenantSchemaName,
  ): Promise<QueryObservablePrismaClient> {
    const cached = this.clients.get(schemaName.value);
    if (cached) return cached;

    const adapter = new PrismaPg(
      {
        connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
        max: 2,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
      },
      { schema: schemaName.value },
    );
    const client = new PrismaClient({
      adapter,
      log: [{ emit: 'event', level: 'query' }],
    }) as QueryObservablePrismaClient;
    await client.$connect();
    this.clients.set(schemaName.value, client);
    return client;
  }

  async dispose(schemaName: TenantSchemaName): Promise<void> {
    const client = this.clients.get(schemaName.value);
    if (!client) return;
    this.clients.delete(schemaName.value);
    await client.$disconnect();
  }

  async disposeAll(): Promise<void> {
    const schemas = [...this.clients.keys()].map((schema) =>
      TenantSchemaName.parse(schema),
    );
    await Promise.all(schemas.map((schema) => this.dispose(schema)));
  }

  async onModuleDestroy(): Promise<void> {
    await this.disposeAll();
  }
}
