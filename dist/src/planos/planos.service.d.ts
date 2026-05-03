import { PrismaService } from '../prisma/prisma.service';
export declare class PlanosService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        meses: number;
        valor: number;
        observacao: string;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        meses: number;
        valor: number;
        observacao: string;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
    }>;
    create(data: any): Promise<{
        id: number;
        meses: number;
        valor: number;
        observacao: string;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        meses: number;
        valor: number;
        observacao: string;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        meses: number;
        valor: number;
        observacao: string;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
    }>;
}
