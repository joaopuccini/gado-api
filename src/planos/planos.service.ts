import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanosService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.plano.findMany({
            where: { excluido: false }
        });
    }

    async findOne(id: number) {
        const plano = await this.prisma.plano.findUnique({
            where: { id }
        });
        if (!plano || plano.excluido) throw new NotFoundException('Plano não encontrado');
        return plano;
    }

    async create(data: any) {
        return this.prisma.plano.create({
            data
        });
    }

    async update(id: number, data: any) {
        await this.findOne(id);
        return this.prisma.plano.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.plano.update({
            where: { id },
            data: { excluido: true, excluido_data: new Date() }
        });
    }
}
