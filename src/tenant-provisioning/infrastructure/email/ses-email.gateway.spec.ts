import { SendEmailCommand } from '@aws-sdk/client-sesv2';
import { SesEmailGateway } from './ses-email.gateway';

describe('SesEmailGateway', () => {
  const send = jest.fn<Promise<unknown>, [SendEmailCommand]>(() =>
    Promise.resolve({}),
  );
  const clientFactory = jest.fn(() => ({ send }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['missingAwsRegion', () => '', () => 'sender@example.com'],
    ['missingSesSender', () => 'sa-east-1', () => '   '],
    ['invalidSesSender', () => 'sa-east-1', () => 'invalid-sender'],
  ])(
    'rejects invalid SES configuration with %s',
    async (code, region, sender) => {
      const gateway = new SesEmailGateway(region, sender, clientFactory);

      await expect(
        gateway.send({
          recipient: 'owner@example.com',
          templateKey: 'tenant-active',
          payload: {},
        }),
      ).rejects.toThrow(code);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it('rejects an unsupported template before contacting SES', async () => {
    const gateway = new SesEmailGateway(
      () => 'sa-east-1',
      () => 'sender@example.com',
      clientFactory,
    );

    await expect(
      gateway.send({
        recipient: 'owner@example.com',
        templateKey: 'unknown-template',
        payload: {},
      }),
    ).rejects.toThrow('unsupportedOnboardingEmailTemplate');
    expect(send).not.toHaveBeenCalled();
  });

  it('renders the active-tenant message and reuses the regional client', async () => {
    const gateway = new SesEmailGateway(
      () => ' sa-east-1 ',
      () => ' sender@example.com ',
      clientFactory,
    );
    const message = {
      recipient: 'owner@example.com',
      templateKey: 'tenant-active',
      payload: { ownerName: 'Maria', tenantName: 'Fazenda Aurora' },
    };

    await gateway.send(message);
    await gateway.send({ ...message, payload: {} });

    expect(clientFactory).toHaveBeenCalledTimes(1);
    expect(clientFactory).toHaveBeenCalledWith('sa-east-1');
    expect(send).toHaveBeenCalledTimes(2);
    const firstCommand = send.mock.calls[0][0];
    const secondCommand = send.mock.calls[1][0];
    expect(firstCommand).toBeInstanceOf(SendEmailCommand);
    expect(firstCommand.input).toMatchObject({
      FromEmailAddress: 'sender@example.com',
      Destination: { ToAddresses: ['owner@example.com'] },
      Content: {
        Simple: {
          Subject: { Data: 'Seu acesso ao Gado está pronto' },
          Body: {
            Text: {
              Data: 'Olá, Maria. O ambiente Fazenda Aurora está ativo e pronto para uso.',
            },
          },
        },
      },
    });
    expect(secondCommand.input.Content?.Simple?.Body?.Text?.Data).toContain(
      'Olá, cliente. O ambiente sua fazenda',
    );
  });
});
