import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    getStats(): Promise<{
        counters: {
            ativos: number;
            vendidos: number;
            mortes: number;
            lotes: number;
            pastos: number;
            pesoMedio: string | number;
        };
        financeiro: {
            saldo_caixa: number | import("@prisma/client-runtime-utils").Decimal;
        };
    }>;
    getTotalMachoFemea(): Promise<{
        label: string;
        qtd: number;
    }[]>;
    getTotalCusto(): Promise<{
        qtd_animais: number;
        valor_animais_sem_custo: number;
        valor_custo: number;
        valor_total: number;
    }>;
    getTotalLPRC(query: any): Promise<any>;
    getTotalTipoCusto(): Promise<never[]>;
    getTotal12Meses(): Promise<{
        data_mes: string;
        valor_total: number;
    }[]>;
    getEvolucaoPeso(): Promise<{
        mes: string;
        pesoMedio: string;
    }[]>;
}
