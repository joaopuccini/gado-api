import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import type {
  EmailGateway,
  OnboardingEmailMessage,
} from '../../application/ports/email.gateway';

interface SesClient {
  send(command: SendEmailCommand): Promise<unknown>;
}

type SesClientFactory = (region: string) => SesClient;

const defaultClientFactory: SesClientFactory = (region) => {
  const client = new SESv2Client({ region });
  return { send: (command) => client.send(command) };
};

const requireValue = (value: string, code: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(code);
  return normalized;
};

const requireSender = (value: string): string => {
  const sender = requireValue(value, 'missingSesSender');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) {
    throw new TypeError('invalidSesSender');
  }
  return sender;
};

const render = (
  message: OnboardingEmailMessage,
): { readonly subject: string; readonly body: string } => {
  if (message.templateKey !== 'tenant-active') {
    throw new RangeError('unsupportedOnboardingEmailTemplate');
  }

  const ownerName = message.payload.ownerName ?? 'cliente';
  const tenantName = message.payload.tenantName ?? 'sua fazenda';
  return {
    subject: 'Seu acesso ao Gado está pronto',
    body: `Olá, ${ownerName}. O ambiente ${tenantName} está ativo e pronto para uso.`,
  };
};

export class SesEmailGateway implements EmailGateway {
  private client: SesClient | undefined;

  constructor(
    private readonly region: () => string,
    private readonly sender: () => string,
    private readonly clientFactory: SesClientFactory = defaultClientFactory,
  ) {}

  async send(message: OnboardingEmailMessage): Promise<void> {
    const region = requireValue(this.region(), 'missingAwsRegion');
    const sender = requireSender(this.sender());
    const content = render(message);
    this.client ??= this.clientFactory(region);

    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: sender,
        Destination: { ToAddresses: [message.recipient] },
        Content: {
          Simple: {
            Subject: { Data: content.subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: content.body, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  }
}
