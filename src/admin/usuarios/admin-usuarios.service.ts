import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AdminPrismaService } from '../admin-prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminUsuariosService {
  constructor(
    private readonly prisma: AdminPrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createAdminUserDto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: createAdminUserDto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já está em uso por outro administrador');
    }

    const hashedPassword = await bcrypt.hash(createAdminUserDto.senha, 10);

    const newUser = await this.prisma.adminUser.create({
      data: {
        nome: createAdminUserDto.nome,
        email: createAdminUserDto.email,
        senhaHash: hashedPassword,
        role: createAdminUserDto.role || 'SUPPORT',
      },
    });

    const { senhaHash, ...result } = newUser;
    return result;
  }

  async findAll() {
    return await this.prisma.adminUser.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException(`AdminUser #${id} não encontrado`);
    return user;
  }

  async update(id: string, updateAdminUserDto: UpdateAdminUserDto) {
    const data: any = { ...updateAdminUserDto };
    
    if (updateAdminUserDto.senha) {
      data.senhaHash = await bcrypt.hash(updateAdminUserDto.senha, 10);
      delete data.senha;
    }

    try {
      const updated = await this.prisma.adminUser.update({
        where: { id },
        data,
      });
      const { senhaHash, ...result } = updated;
      return result;
    } catch (e) {
      throw new NotFoundException(`AdminUser #${id} não encontrado`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.adminUser.update({
        where: { id },
        data: { ativo: false },
      });
    } catch (e) {
      throw new NotFoundException(`AdminUser #${id} não encontrado`);
    }
  }

  async login(email: string, senhaPlana: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário inativo');
    }

    const isMatch = await bcrypt.compare(senhaPlana, user.senhaHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, isAdmin: true };
    const token = this.jwtService.sign(payload);

    const { senhaHash, ...result } = user;

    return {
      user: result,
      token,
    };
  }
}
