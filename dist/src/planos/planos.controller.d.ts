import { PlanosService } from './planos.service';
export declare class PlanosController {
    private readonly planosService;
    constructor(planosService: PlanosService);
    findAll(): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            meses: number;
            valor: number;
            observacao: string;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        }[];
    }>;
    findOne(id: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            meses: number;
            valor: number;
            observacao: string;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    create(data: any): Promise<{
        message: string;
        response: {
            id: number;
            meses: number;
            valor: number;
            observacao: string;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    update(id: number, data: any): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            meses: number;
            valor: number;
            observacao: string;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            meses: number;
            valor: number;
            observacao: string;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
}
