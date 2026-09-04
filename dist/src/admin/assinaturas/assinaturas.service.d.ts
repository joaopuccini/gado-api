import { AdminPrismaService } from '../admin-prisma.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';
export declare class AssinaturasService {
    private readonly prisma;
    constructor(prisma: AdminPrismaService);
    create(createAssinaturaDto: CreateAssinaturaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        organizacaoId: string;
        planoId: string;
        dataInicio: Date;
        dataVencimento: Date;
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
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
            telefone: string | null;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        organizacaoId: string;
        planoId: string;
        dataInicio: Date;
        dataVencimento: Date;
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
            subdomain: string;
            razaoSocial: string;
            nomeFantasia: string;
            cnpj: string | null;
            telefone: string | null;
            schemaName: string;
            status: import("@prisma/client-admin/client").$Enums.OrganizacaoStatus;
        };
        pagamentos: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client-admin/client").$Enums.PagamentoStatus;
            assinaturaId: string;
            valor: import("@prisma/client-runtime-utils").Decimal;
            competencia: string;
            dataPagamento: Date | null;
            observacao: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        organizacaoId: string;
        planoId: string;
        dataInicio: Date;
        dataVencimento: Date;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    update(id: string, updateAssinaturaDto: UpdateAssinaturaDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        organizacaoId: string;
        planoId: string;
        dataInicio: Date;
        dataVencimento: Date;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.AssinaturaStatus;
        organizacaoId: string;
        planoId: string;
        dataInicio: Date;
        dataVencimento: Date;
        diaVencimento: number;
        gracePeriodDias: number;
    }>;
    registrarPagamento(pagamentoId: string, valorPago: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client-admin/client").$Enums.PagamentoStatus;
        assinaturaId: string;
        valor: import("@prisma/client-runtime-utils").Decimal;
        competencia: string;
        dataPagamento: Date | null;
        observacao: string | null;
    }>;
}
