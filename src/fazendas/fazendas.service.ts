import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FazendasService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.fazenda.findMany({
            where: { excluido: false },
            include: {
                mensalidades: true
            }
        });
    }

    async findOne(id: number) {
        const fazenda = await this.prisma.fazenda.findUnique({
            where: { id },
            include: { mensalidades: true }
        });
        if (!fazenda || fazenda.excluido) throw new NotFoundException('Fazenda não encontrada');
        return fazenda;
    }

    async findByUserId(usuarioId: number) {
        return this.prisma.fazenda.findMany({
            where: {
                id_usuarios: { has: usuarioId },
                excluido: false
            }
        });
    }

    async create(data: any) {
        return this.prisma.fazenda.create({
            data: {
                ...data,
                status: data.status || 'PENDENTE',
            }
        });
    }

    async update(id: number, data: any) {
        await this.findOne(id);
        return this.prisma.fazenda.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.fazenda.update({
            where: { id },
            data: { excluido: true, excluido_data: new Date() }
        });
    }
}
