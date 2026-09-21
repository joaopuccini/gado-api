import type {
  AdminIdentityRepository,
  AdminPasswordVerifier,
  AdminTokenIssuer,
} from '../ports/admin-login.ports';
import { AdminLoginUseCase } from './admin-login.use-case';

describe('AdminLoginUseCase', () => {
  const findByEmail = jest.fn<
    ReturnType<AdminIdentityRepository['findByEmail']>,
    Parameters<AdminIdentityRepository['findByEmail']>
  >();
  const compare = jest.fn<
    ReturnType<AdminPasswordVerifier['compare']>,
    Parameters<AdminPasswordVerifier['compare']>
  >();
  const sign = jest.fn<
    ReturnType<AdminTokenIssuer['sign']>,
    Parameters<AdminTokenIssuer['sign']>
  >();
  const identities: jest.Mocked<AdminIdentityRepository> = {
    findByEmail,
  };
  const passwords: jest.Mocked<AdminPasswordVerifier> = {
    compare,
  };
  const tokens: jest.Mocked<AdminTokenIssuer> = {
    sign,
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
    findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: ' ADMIN@GADO.COM ', password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(findByEmail).toHaveBeenCalledWith('admin@gado.com');
    expect(compare).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });

  it('rejects an inactive administrator before checking the password', async () => {
    findByEmail.mockResolvedValue({ ...adminUser, active: false });

    await expect(
      useCase.execute({ email: adminUser.email, password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(compare).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without issuing a token', async () => {
    findByEmail.mockResolvedValue(adminUser);
    compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: adminUser.email, password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(sign).not.toHaveBeenCalled();
  });

  it('issues only a gado-admin audience token for valid credentials', async () => {
    findByEmail.mockResolvedValue(adminUser);
    compare.mockResolvedValue(true);
    sign.mockResolvedValue('mock-token');

    await expect(
      useCase.execute({ email: adminUser.email, password: 'secret' }),
    ).resolves.toEqual({ token: 'mock-token' });
    expect(sign).toHaveBeenCalledWith({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      aud: 'gado-admin',
    });
  });
});
