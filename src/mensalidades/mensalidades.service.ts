import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MensalidadesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.planoMensalidade.findMany({
            include: {
                // plano: true, // Se quiser incluir detalhes do plano
                // fazenda: true
            }
        });
    }

    async findOne(id: number) {
        const mensalidade = await this.prisma.planoMensalidade.findUnique({
            where: { id }
        });
        if (!mensalidade) throw new NotFoundException('Mensalidade não encontrada');
        return mensalidade;
    }

    async create(data: any) {
        return this.prisma.planoMensalidade.create({
            data
        });
    }

    async update(id: number, data: any) {
        await this.findOne(id);
        return this.prisma.planoMensalidade.update({
            where: { id },
            data
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.planoMensalidade.delete({
            where: { id }
        });
    }
}
