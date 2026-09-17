import { AssinaturasService } from './assinaturas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';
export declare class AssinaturasController {
    private readonly assinaturasService;
    constructor(assinaturasService: AssinaturasService);
    create(createAssinaturaDto: CreateAssinaturaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        dataInicio: Date;
        dataVencimento: Date;
        organizacaoId: string;
        planoId: string;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    findAll(): Promise<({
        plano: {
            id: string;
            nome: string;
            maxUsuarios: number;
            maxFazendas: number;
            precoMensal: import("@prisma/client-runtime-utils").Decimal;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        organizacao: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
            telefone: string | null;
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        dataInicio: Date;
        dataVencimento: Date;
        organizacaoId: string;
        planoId: string;
        diaVencimento: number;
        gracePeriodDias: number;
    })[]>;
    findOne(id: string): Promise<{
        plano: {
            id: string;
            nome: string;
            maxUsuarios: number;
            maxFazendas: number;
            precoMensal: import("@prisma/client-runtime-utils").Decimal;
            ativo: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        organizacao: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
            telefone: string | null;
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
        };
        pagamentos: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            observacao: string | null;
            valor: import("@prisma/client-runtime-utils").Decimal;
            status: import("@prisma/client-admin/client").$Enums.PagamentoStatus;
            dataPagamento: Date | null;
            assinaturaId: string;
            competencia: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        dataInicio: Date;
        dataVencimento: Date;
        organizacaoId: string;
        planoId: string;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    update(id: string, updateAssinaturaDto: UpdateAssinaturaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        dataInicio: Date;
        dataVencimento: Date;
        organizacaoId: string;
        planoId: string;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        dataInicio: Date;
        dataVencimento: Date;
        organizacaoId: string;
        planoId: string;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    registrarBaixa(pagamentoId: string, valorPago: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        observacao: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        status: import("@prisma/client-admin/client").$Enums.PagamentoStatus;
        dataPagamento: Date | null;
        assinaturaId: string;
        competencia: string;
    }>;
}
