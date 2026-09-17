import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';

@Injectable()
export class AdminLoginUseCase {
    constructor(
        private readonly adminPrisma: AdminPrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async execute(dto: any) {
        const email = dto.email.toLowerCase();

        const adminUser = await this.adminPrisma.adminUser.findUnique({
            where: { email },
        });

        if (!adminUser || !adminUser.ativo) {
            throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
        }

        const passwordValid = await bcrypt.compare(dto.password, adminUser.senhaHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const payload = {
            sub: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            aud: 'gado-admin',
        };

        const token = this.jwtService.sign(payload);

        return { token };
    }
}
