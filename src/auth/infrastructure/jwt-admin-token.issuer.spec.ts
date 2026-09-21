import type { JwtService } from '@nestjs/jwt';
import { JwtAdminTokenIssuer } from './jwt-admin-token.issuer';

describe('JwtAdminTokenIssuer', () => {
  it('signs the application claims without duplicating audience options', async () => {
    const signAsync = jest.fn().mockResolvedValue('admin-token');
    const issuer = new JwtAdminTokenIssuer({
      signAsync,
    } as unknown as JwtService);
    const claims = {
      sub: 'admin-id',
      email: 'admin@gado.com',
      role: 'SUPPORT',
      aud: 'gado-admin' as const,
    };

    await expect(issuer.sign(claims)).resolves.toBe('admin-token');
    expect(signAsync).toHaveBeenCalledWith(claims);
  });
});
