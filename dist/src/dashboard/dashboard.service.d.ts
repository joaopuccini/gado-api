import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private withTenant;
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
    getTotalCustoAnimaisComCusto(): Promise<{
        qtd_animais: number;
        valor_animais_sem_custo: number;
        valor_custo: number;
        valor_total: number;
    }>;
    getTotalLotesPastosRacasClientesAtivos(query: any): Promise<any>;
    getTotalPorTipoCusto(): Promise<never[]>;
    getTotalCusto12Meses(): Promise<unknown>;
}
