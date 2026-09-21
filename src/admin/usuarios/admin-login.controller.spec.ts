import type { AdminLoginUseCase } from '../../auth/application/use-cases/admin-login.use-case';
import { AdminUsuariosController } from './admin-usuarios.controller';
import type { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminUsuariosController admin login', () => {
  it('delegates the camelCase HTTP contract to AdminLoginUseCase', async () => {
    const execute = jest.fn().mockResolvedValue({ token: 'admin-token' });
    const controller = new AdminUsuariosController(
      {} as AdminUsuariosService,
      { execute } as unknown as AdminLoginUseCase,
    );

    await expect(
      controller.login({ email: 'Admin@Gado.com', password: 'secret' }),
    ).resolves.toEqual({ token: 'admin-token' });
    expect(execute).toHaveBeenCalledWith({
      email: 'Admin@Gado.com',
      password: 'secret',
    });
  });
});
