import { DomainError } from '../../../common/errors/domain-error';
import type {
  AdminIdentityRepository,
  AdminPasswordVerifier,
  AdminTokenIssuer,
} from '../ports/admin-login.ports';

export interface AdminLoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface AdminLoginResult {
  readonly token: string;
}

export class AdminLoginUseCase {
  constructor(
    private readonly identities: AdminIdentityRepository,
    private readonly passwords: AdminPasswordVerifier,
    private readonly tokens: AdminTokenIssuer,
  ) {}

  async execute(command: AdminLoginCommand): Promise<AdminLoginResult> {
    const email = command.email.trim().toLowerCase();
    const identity = await this.identities.findByEmail(email);
    if (!identity?.active) this.rejectCredentials();

    const passwordIsValid = await this.passwords.compare(
      command.password,
      identity.passwordHash,
    );
    if (!passwordIsValid) this.rejectCredentials();

    const token = await this.tokens.sign({
      sub: identity.id,
      email: identity.email,
      role: identity.role,
      aud: 'gado-admin',
    });

    return { token };
  }

  private rejectCredentials(): never {
    throw new DomainError('unauthenticated', 'Credenciais inválidas');
  }
}
