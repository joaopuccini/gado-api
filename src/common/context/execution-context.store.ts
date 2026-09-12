import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../errors/domain-error';

export type ContextType = 'admin' | 'tenant' | 'public' | 'job';

export interface ExecutionContextData {
  requestId: string;
  traceId: string;
  contextType: ContextType;
  startedAt: number;
  method?: string;
  path?: string;
  tenantId?: string;
  organizationId?: string;
  schemaName?: string;
  globalUserId?: string;
  localUserId?: number;
  farmId?: number;
  accessibleFarmIds: readonly number[];
  permissions: readonly string[];
}

export interface VerifiedTenantContext {
  tenantId: string;
  organizationId: string;
  schemaName: string;
  globalUserId: string;
  localUserId: number;
  farmId: number;
  accessibleFarmIds: readonly number[];
  permissions: readonly string[];
}

export type RequiredTenantContext = ExecutionContextData &
  Required<
    Pick<
      ExecutionContextData,
      | 'tenantId'
      | 'organizationId'
      | 'schemaName'
      | 'globalUserId'
      | 'localUserId'
      | 'farmId'
    >
  >;

const freezeContext = (
  context: ExecutionContextData,
): Readonly<ExecutionContextData> =>
  Object.freeze({
    ...context,
    accessibleFarmIds: Object.freeze([...context.accessibleFarmIds]),
    permissions: Object.freeze([...context.permissions]),
  });

@Injectable()
export class ExecutionContextStore {
  private readonly storage = new AsyncLocalStorage<
    Readonly<ExecutionContextData>
  >();

  run<T>(context: ExecutionContextData, callback: () => T): T {
    return this.storage.run(freezeContext(context), callback);
  }

  current(): Readonly<ExecutionContextData> | undefined {
    return this.storage.getStore();
  }

  require(): Readonly<ExecutionContextData> {
    const context = this.current();
    if (!context) {
      throw new DomainError(
        'executionContextMissing',
        'Contexto de execução ausente',
      );
    }
    return context;
  }

  enrichTenant(verified: VerifiedTenantContext): void {
    const current = this.require();
    this.storage.enterWith(
      freezeContext({ ...current, ...verified, contextType: 'tenant' }),
    );
  }

  requireTenant(): Readonly<RequiredTenantContext> {
    const context = this.require();
    const hasRequiredIdentity =
      context.tenantId !== undefined &&
      context.organizationId !== undefined &&
      context.schemaName !== undefined &&
      context.globalUserId !== undefined &&
      context.localUserId !== undefined &&
      context.farmId !== undefined;

    if (
      !['tenant', 'job'].includes(context.contextType) ||
      !hasRequiredIdentity
    ) {
      throw new DomainError(
        'tenantContextMissing',
        'Contexto de tenant ausente',
      );
    }

    return context as Readonly<RequiredTenantContext>;
  }
}
