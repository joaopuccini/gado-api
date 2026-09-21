import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ProvisioningCredentialService {
  constructor(private readonly jwt: JwtService) {}

  issue(globalUserId: string, provisioningRunId: string): string {
    return this.jwt.sign(
      {
        sub: globalUserId,
        provisioningRunId,
        purpose: 'provisioning',
      },
      { audience: 'gado-provisioning', expiresIn: '15m' },
    );
  }
}
