import type { Response } from 'express';
import { AuthController } from '../../../auth/auth.controller';
import type { AuthService } from '../../../auth/auth.service';

interface AcceptedOnboarding {
  readonly provisioningRunId: string;
  readonly state: 'registered' | 'provisioning';
  readonly statusUrl: string;
}

interface AsyncAuthController {
  register(dto: {
    readonly nome: string;
    readonly email: string;
    readonly password: string;
    readonly farmName: string;
  }): Promise<AcceptedOnboarding>;
  provisioningStatus(
    runId: string,
    credential: { readonly sub: string; readonly purpose: 'provisioning' },
  ): Promise<{
    readonly provisioningRunId: string;
    readonly state: 'registered' | 'provisioning' | 'active' | 'failed';
  }>;
}

describe('asynchronous onboarding API', () => {
  const accepted: AcceptedOnboarding = {
    provisioningRunId: '11111111-1111-4111-8111-111111111111',
    state: 'registered',
    statusUrl: '/auth/provisioning/11111111-1111-4111-8111-111111111111',
  };
  const startTenantOnboarding = {
    execute: jest.fn(() =>
      Promise.resolve({ ...accepted, globalUserId: 'global-user-id' }),
    ),
  };
  const getProvisioningStatus = {
    execute: jest.fn((provisioningRunId: string) =>
      Promise.resolve({ provisioningRunId, state: 'registered' as const }),
    ),
  };
  const provisioningCredential = { issue: jest.fn(() => 'provisional') };
  const googleLogin = jest.fn(() =>
    Promise.resolve({
      token: 'legacy-token',
      user: { id: 'global-user-id' },
    }),
  );
  const authService = {
    login: jest.fn(),
    googleLogin,
  } as unknown as AuthService;
  const controller = new AuthController(
    authService,
    startTenantOnboarding as never,
    getProvisioningStatus as never,
    provisioningCredential as never,
  );
  const asyncController = controller as unknown as AsyncAuthController;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts e-mail registration without issuing a tenant access token', async () => {
    const response = await asyncController.register({
      nome: 'Owner',
      email: 'owner@example.com',
      password: 'secret-pass',
      farmName: 'Fazenda Principal',
    });

    expect(response).toEqual(accepted);
    expect(JSON.stringify(response)).not.toContain('token');
    expect(startTenantOnboarding.execute.mock.calls).toEqual([
      [
        {
          provider: 'email',
          ownerName: 'Owner',
          ownerEmail: 'owner@example.com',
          password: 'secret-pass',
          farmName: 'Fazenda Principal',
        },
      ],
    ]);
  });

  it('starts Google onboarding through the same path instead of emitting a normal token', async () => {
    const redirect = jest.fn();
    const response = {
      redirect,
    } as unknown as Response;

    await controller.googleAuthRedirect(
      {
        user: {
          email: 'owner@example.com',
          nome: 'Owner',
          googleId: 'google-id',
          fotoUrl: 'https://example.test/avatar.png',
        },
      } as never,
      response,
    );

    expect(googleLogin).not.toHaveBeenCalled();
    expect(startTenantOnboarding.execute.mock.calls).toEqual([
      [
        {
          provider: 'google',
          ownerEmail: 'owner@example.com',
          ownerName: 'Owner',
          providerUserId: 'google-id',
        },
      ],
    ]);
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining(
        '/auth/provisioning/11111111-1111-4111-8111-111111111111',
      ),
    );
    expect(redirect).not.toHaveBeenCalledWith(
      expect.stringContaining('token='),
    );
  });

  it('returns only public provisioning status for the initiating identity', async () => {
    const status = await asyncController.provisioningStatus(
      accepted.provisioningRunId,
      { sub: 'global-user-id', purpose: 'provisioning' },
    );

    expect(status).toEqual({
      provisioningRunId: accepted.provisioningRunId,
      state: 'registered',
    });
    expect(JSON.stringify(status)).not.toContain('schema');
    expect(JSON.stringify(status)).not.toContain('stack');
    expect(JSON.stringify(status)).not.toContain('retry');
  });
});
