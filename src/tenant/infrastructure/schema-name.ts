import { DomainError } from '../../common/errors/domain-error';

const tenantSchemaPattern = /^tenant_[0-9a-f]{32}$/;

export class TenantSchemaName {
  private constructor(readonly value: string) {}

  static parse(value: string): TenantSchemaName {
    if (!tenantSchemaPattern.test(value)) {
      throw new DomainError(
        'invalidTenantSchemaName',
        'Nome de schema de tenant inválido',
      );
    }
    return new TenantSchemaName(value);
  }
}
