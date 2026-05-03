import { FazendasService } from './fazendas.service';
export declare class FazendasController {
    private readonly fazendasService;
    constructor(fazendasService: FazendasService);
    findAll(): Promise<{
        sucesso: boolean;
        data: ({
            mensalidades: {
                id: number;
                status: string;
                excluido: boolean;
                excluido_data: Date | null;
                createdAt: Date;
                id_plano: number;
                id_fazenda: number;
                vencimento: Date;
                valor_pagamento: number | null;
                data_pagamento: Date | null;
            }[];
        } & {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        })[];
    }>;
    findOne(id: number): Promise<{
        sucesso: boolean;
        data: {
            mensalidades: {
                id: number;
                status: string;
                excluido: boolean;
                excluido_data: Date | null;
                createdAt: Date;
                id_plano: number;
                id_fazenda: number;
                vencimento: Date;
                valor_pagamento: number | null;
                data_pagamento: Date | null;
            }[];
        } & {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    findByUserId(usuarioId: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        }[];
    }>;
    create(data: any): Promise<{
        message: string;
        response: {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    update(id: number, data: any): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
    remove(id: number): Promise<{
        sucesso: boolean;
        data: {
            id: number;
            id_usuarios: number[];
            nome: string | null;
            status: string;
            saldo: number;
            celular: string | null;
            validade: Date | null;
            cpf_cnpj: string | null;
            nome_proprietario: string | null;
            cep: string | null;
            cidade: string | null;
            bairro: string | null;
            endereco: string | null;
            estado: string | null;
            numero: number | null;
            observacao: string | null;
            excluido: boolean;
            excluido_data: Date | null;
            createdAt: Date;
        };
    }>;
}
