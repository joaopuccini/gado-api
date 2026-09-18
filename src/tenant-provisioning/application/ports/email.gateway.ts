export const EMAIL_GATEWAY = Symbol('EMAIL_GATEWAY');

export type OnboardingEmailPayload = Readonly<Record<string, string>>;

export interface OnboardingEmailMessage {
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: OnboardingEmailPayload;
}

export interface EmailGateway {
  send(message: OnboardingEmailMessage): Promise<void>;
}
