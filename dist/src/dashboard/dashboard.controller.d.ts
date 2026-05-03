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
        };
        financeiro: {
            saldo_caixa: number;
        };
    }>;
    getTotalMachoFemea(): Promise<{
        label: string;
        qtd: number;
    }[]>;
    getTotalCusto(): Promise<{
        sucesso: boolean;
        data: {
            qtd_animais: number;
            valor_animais_sem_custo: number;
            valor_custo: number;
            valor_total: number;
        };
    }>;
    getTotalLPRC(query: any): Promise<{
        sucesso: boolean;
        data: any;
    }>;
    getTotalTipoCusto(): Promise<never[]>;
    getTotal12Meses(): Promise<{
        sucesso: boolean;
        data: unknown;
    }>;
}
