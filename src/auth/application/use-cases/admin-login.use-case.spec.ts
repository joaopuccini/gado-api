import type {
  AdminIdentityRepository,
  AdminPasswordVerifier,
  AdminTokenIssuer,
} from '../ports/admin-login.ports';
import { AdminLoginUseCase } from './admin-login.use-case';

describe('AdminLoginUseCase', () => {
  const identities: jest.Mocked<AdminIdentityRepository> = {
    findByEmail: jest.fn(),
  };
  const passwords: jest.Mocked<AdminPasswordVerifier> = {
    compare: jest.fn(),
  };
  const tokens: jest.Mocked<AdminTokenIssuer> = {
    sign: jest.fn(),
  };
  const adminUser = {
    id: 'uuid-123',
    email: 'admin@gado.com',
    passwordHash: 'hashed-password',
    role: 'SUPERADMIN',
    active: true,
  };

  let useCase: AdminLoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AdminLoginUseCase(identities, passwords, tokens);
  });

  it('normalizes e-mail and rejects an unknown administrator', async () => {
    identities.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: ' ADMIN@GADO.COM ', password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(identities.findByEmail).toHaveBeenCalledWith('admin@gado.com');
    expect(passwords.compare).not.toHaveBeenCalled();
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('rejects an inactive administrator before checking the password', async () => {
    identities.findByEmail.mockResolvedValue({ ...adminUser, active: false });

    await expect(
      useCase.execute({ email: adminUser.email, password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(passwords.compare).not.toHaveBeenCalled();
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without issuing a token', async () => {
    identities.findByEmail.mockResolvedValue(adminUser);
    passwords.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: adminUser.email, password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it('issues only a gado-admin audience token for valid credentials', async () => {
    identities.findByEmail.mockResolvedValue(adminUser);
    passwords.compare.mockResolvedValue(true);
    tokens.sign.mockResolvedValue('mock-token');

    await expect(
      useCase.execute({ email: adminUser.email, password: 'secret' }),
    ).resolves.toEqual({ token: 'mock-token' });
    expect(tokens.sign).toHaveBeenCalledWith({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      aud: 'gado-admin',
    });
  });
});
