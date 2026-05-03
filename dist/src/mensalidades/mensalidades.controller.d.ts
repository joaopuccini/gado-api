import { MensalidadesService } from './mensalidades.service';
export declare class MensalidadesController {
    private readonly mensalidadesService;
    constructor(mensalidadesService: MensalidadesService);
    findAll(): Promise<{
        sucesso: boolean;
        data: ({} & {
            id: number;
            id_plano: number;
            id_fazenda: number;
            status: string;
            vencimento: Date;
            valor_pagamento: number | null;
            data_pagamento: Date | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        })[];
    }>;
    findOne(id: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_plano: number;
            id_fazenda: number;
            status: string;
            vencimento: Date;
            valor_pagamento: number | null;
            data_pagamento: Date | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    create(data: any): Promise<{
        message: string;
        response: {
            id: number;
            id_plano: number;
            id_fazenda: number;
            status: string;
            vencimento: Date;
            valor_pagamento: number | null;
            data_pagamento: Date | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    update(id: number, data: any): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_plano: number;
            id_fazenda: number;
            status: string;
            vencimento: Date;
            valor_pagamento: number | null;
            data_pagamento: Date | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_plano: number;
            id_fazenda: number;
            status: string;
            vencimento: Date;
            valor_pagamento: number | null;
            data_pagamento: Date | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
}
