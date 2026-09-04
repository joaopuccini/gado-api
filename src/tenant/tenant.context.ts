import { AsyncLocalStorage } from 'async_hooks';

export interface TenantInfo {
  tenantId: string;
  schemaName: string;
  organizacaoId: string;
  subdomain?: string;
  status: string;
  resolvedVia?: 'subdomain' | 'header' | 'jwt';
}

/**
 * AsyncLocalStorage para propagar tenant info pelo request lifecycle.
 * Permite acesso ao tenant atual em qualquer ponto da stack sem depender do Request.
 */
export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantInfo>();

  static run<T>(tenant: TenantInfo, fn: () => T): T {
    return this.storage.run(tenant, fn);
  }

  static get(): TenantInfo | undefined {
    return this.storage.getStore();
  }

  static getOrFail(): TenantInfo {
    const tenant = this.storage.getStore();
    if (!tenant) {
      throw new Error('TenantContext não disponível - middleware não configurado ou contexto admin');
    }
    return tenant;
  }

  static getSchemaName(): string | undefined {
    return this.storage.getStore()?.schemaName;
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }
}
