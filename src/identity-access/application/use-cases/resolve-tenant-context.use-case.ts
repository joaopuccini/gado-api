import {
  ExecutionContextStore,
  type RequiredTenantContext,
} from '../../../common/context';
import { DomainError } from '../../../common/errors/domain-error';
import type { TenantRegistryRepository } from '../ports/tenant-registry.repository';

export interface ResolveTenantContextInput {
  verifiedSubject: string;
  tenantId: string;
  verifiedOrganizationId: string;
  requestedFarmId: number;
  hostTenant?: string;
  requestedSchemaName?: string;
}

export class ResolveTenantContextUseCase {
  constructor(
    private readonly registry: TenantRegistryRepository,
    private readonly contextStore: ExecutionContextStore,
  ) {}

  async execute(
    input: ResolveTenantContextInput,
  ): Promise<Readonly<RequiredTenantContext>> {
    const tenant = await this.registry.findById(input.tenantId);
    if (!tenant || tenant.status !== 'active') {
      throw new DomainError('tenantUnavailable', 'Organização indisponível');
    }

    if (input.verifiedOrganizationId !== tenant.organizationId) {
      throw new DomainError(
        'forbidden',
        'Organização divergente da identidade',
      );
    }

    const acceptedTransportHints = new Set([
      tenant.tenantId,
      tenant.organizationId,
      tenant.subdomain,
    ]);
    if (
      input.hostTenant &&
      !acceptedTransportHints.has(input.hostTenant.toLowerCase())
    ) {
      throw new DomainError('forbidden', 'Tenant divergente da identidade');
    }

    const membership = await this.registry.findMembership(
      tenant,
      input.verifiedSubject,
    );
    if (!membership) {
      throw new DomainError('forbidden', 'Vínculo com a organização ausente');
    }

    const selectedFarm = membership.farms.find(
      ({ farmId }) => farmId === input.requestedFarmId,
    );
    if (!selectedFarm) {
      throw new DomainError('forbidden', 'Acesso à fazenda negado');
    }

    this.contextStore.enrichTenant({
      tenantId: tenant.tenantId,
      organizationId: tenant.organizationId,
      schemaName: tenant.schemaName,
      globalUserId: input.verifiedSubject,
      localUserId: membership.localUserId,
      farmId: selectedFarm.farmId,
      accessibleFarmIds: membership.farms.map(({ farmId }) => farmId),
      permissions: selectedFarm.permissions,
    });

    return this.contextStore.requireTenant();
  }
}
