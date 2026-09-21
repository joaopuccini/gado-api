import { AdminPrismaService } from '../../admin/admin-prisma.service';
import type {
  AdminIdentity,
  AdminIdentityRepository,
} from '../application/ports/admin-login.ports';

export class PrismaAdminIdentityRepository implements AdminIdentityRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async findByEmail(email: string): Promise<AdminIdentity | null> {
    const identity = await this.database.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        senhaHash: true,
        role: true,
        ativo: true,
      },
    });
    return identity
      ? {
          id: identity.id,
          email: identity.email,
          passwordHash: identity.senhaHash,
          role: identity.role,
          active: identity.ativo,
        }
      : null;
  }
}
