import { DomainError } from '../../../common/errors/domain-error';
import type {
  IssuedAccessToken,
  OperationalAccess,
  OperationalAccessRepository,
  OperationalIdentityRepository,
  PasswordVerifier,
  TenantTokenIssuer,
} from '../ports/tenant-login.ports';

export interface TenantLoginCommand {
  readonly email: string;
  readonly password: string;
  readonly farmId?: number;
}

export interface FarmSelectionRequired {
  readonly requiresFarmSelection: true;
  readonly farms: readonly {
    readonly id: number;
    readonly name: string;
    readonly organizationId: string;
  }[];
}

export type TenantLoginResult = IssuedAccessToken | FarmSelectionRequired;

export class TenantLoginUseCase {
  constructor(
    private readonly identities: OperationalIdentityRepository,
    private readonly accesses: OperationalAccessRepository,
    private readonly passwords: PasswordVerifier,
    private readonly tokens: TenantTokenIssuer,
  ) {}

  async execute(command: TenantLoginCommand): Promise<TenantLoginResult> {
    const email = command.email.trim().toLowerCase();
    const identity = await this.identities.findActiveByEmail(email);
    if (!identity?.passwordHash) this.rejectCredentials();

    const passwordIsValid = await this.passwords.compare(
      command.password,
      identity.passwordHash,
    );
    if (!passwordIsValid) this.rejectCredentials();

    const activeAccesses = await this.accesses.listActiveByGlobalUser(
      identity.id,
    );
    if (activeAccesses.length === 0) this.rejectCredentials();

    const selectedAccess = this.selectAccess(activeAccesses, command.farmId);
    if (!selectedAccess) {
      return {
        requiresFarmSelection: true,
        farms: activeAccesses.map((access) => ({
          id: access.farmId,
          name: access.farmName,
          organizationId: access.organizationId,
        })),
      };
    }

    return this.tokens.sign({
      aud: 'gado-tenant',
      sub: identity.id,
      email: identity.email,
      organizationId: selectedAccess.organizationId,
      tenantId: selectedAccess.tenantId,
      schemaName: selectedAccess.schemaName,
      localUserId: selectedAccess.localUserId,
      farmId: selectedAccess.farmId,
      accessibleFarmIds: selectedAccess.accessibleFarmIds,
      role: selectedAccess.role,
      permissions: selectedAccess.permissions,
    });
  }

  private selectAccess(
    accesses: readonly OperationalAccess[],
    farmId?: number,
  ): OperationalAccess | undefined {
    if (farmId !== undefined) {
      const selected = accesses.find((access) => access.farmId === farmId);
      if (!selected) this.rejectCredentials();
      return selected;
    }
    return accesses.length === 1 ? accesses[0] : undefined;
  }

  private rejectCredentials(): never {
    throw new DomainError('unauthenticated', 'Credenciais inválidas');
  }
}
