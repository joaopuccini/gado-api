import { PlanosService } from './planos.service';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
export declare class PlanosController {
    private readonly planosService;
    constructor(planosService: PlanosService);
    create(createPlanoDto: CreatePlanoDto): Promise<{
        id: string;
        nome: string;
        maxUsuarios: number;
        maxFazendas: number;
        precoMensal: import("@prisma/client-runtime-utils").Decimal;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        nome: string;
        maxUsuarios: number;
        maxFazendas: number;
        precoMensal: import("@prisma/client-runtime-utils").Decimal;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        nome: string;
        maxUsuarios: number;
        maxFazendas: number;
        precoMensal: import("@prisma/client-runtime-utils").Decimal;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updatePlanoDto: UpdatePlanoDto): Promise<{
        id: string;
        nome: string;
        maxUsuarios: number;
        maxFazendas: number;
        precoMensal: import("@prisma/client-runtime-utils").Decimal;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        nome: string;
        maxUsuarios: number;
        maxFazendas: number;
        precoMensal: import("@prisma/client-runtime-utils").Decimal;
        ativo: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
