import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminPrismaService } from '../admin-prisma.service';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';

@Injectable()
export class PlanosService {
  constructor(private readonly prisma: AdminPrismaService) {}

  async create(createPlanoDto: CreatePlanoDto) {
    return await this.prisma.plano.create({
      data: createPlanoDto,
    });
  }

  async findAll() {
    return await this.prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const plano = await this.prisma.plano.findUnique({
      where: { id },
    });
    if (!plano) {
      throw new NotFoundException(`Plano #${id} não encontrado`);
    }
    return plano;
  }

  async update(id: string, updatePlanoDto: UpdatePlanoDto) {
    try {
      return await this.prisma.plano.update({
        where: { id },
        data: updatePlanoDto,
      });
    } catch (e) {
      throw new NotFoundException(`Plano #${id} não encontrado`);
    }
  }

  async remove(id: string) {
    // Soft delete
    try {
      return await this.prisma.plano.update({
        where: { id },
        data: { ativo: false },
      });
    } catch (e) {
      throw new NotFoundException(`Plano #${id} não encontrado`);
    }
  }
}
