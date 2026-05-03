import { PrismaService } from '../prisma/prisma.service';
export declare class MensalidadesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({} & {
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        status: string;
        id_plano: number;
        id_fazenda: number;
        vencimento: Date;
        valor_pagamento: number | null;
        data_pagamento: Date | null;
    })[]>;
    findOne(id: number): Promise<{
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        status: string;
        id_plano: number;
        id_fazenda: number;
        vencimento: Date;
        valor_pagamento: number | null;
        data_pagamento: Date | null;
    }>;
    create(data: any): Promise<{
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        status: string;
        id_plano: number;
        id_fazenda: number;
        vencimento: Date;
        valor_pagamento: number | null;
        data_pagamento: Date | null;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        status: string;
        id_plano: number;
        id_fazenda: number;
        vencimento: Date;
        valor_pagamento: number | null;
        data_pagamento: Date | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        excluido: boolean;
        excluido_data: Date | null;
        createdAt: Date;
        status: string;
        id_plano: number;
        id_fazenda: number;
        vencimento: Date;
        valor_pagamento: number | null;
        data_pagamento: Date | null;
    }>;
}
