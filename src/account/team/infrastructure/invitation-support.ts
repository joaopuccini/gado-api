import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import type {
  Clock,
  InvitationOutbox,
  TokenGenerator,
  TokenHasher,
} from '../application/ports/invitation.repository';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }
}

export class Sha256TokenHasher implements TokenHasher {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

@Injectable()
export class PrismaInvitationOutbox implements InvitationOutbox {
  constructor(private readonly database: AdminPrismaService) {}

  async enqueue(input: {
    invitationId: string;
    organizationId: string;
    email: string;
    plainToken: string;
  }): Promise<void> {
    await this.database.conviteOutbox.create({
      data: {
        conviteId: input.invitationId,
        eventKey: `invitation:${input.invitationId}`,
        recipient: input.email,
        payload: {
          organizationId: input.organizationId,
          token: input.plainToken,
        },
      },
    });
  }
}
