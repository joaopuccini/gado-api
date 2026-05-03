"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
require("dotenv/config");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Iniciando seeding...');
    const planos = [
        { meses: 1, valor: 50.0, observacao: 'Plano Mensal' },
        { meses: 6, valor: 250.0, observacao: 'Plano Semestral (Bônus 1 mês)' },
        { meses: 12, valor: 450.0, observacao: 'Plano Anual (Bônus 3 meses)' },
    ];
    for (const plano of planos) {
        await prisma.plano.upsert({
            where: { id: planos.indexOf(plano) + 1 },
            update: {},
            create: {
                id: planos.indexOf(plano) + 1,
                ...plano,
            },
        });
    }
    console.log('✅ Planos criados');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@gado.com.br' },
        update: {},
        create: {
            nome: 'Administrador Gado',
            email: 'admin@gado.com.br',
            password: hashedPassword,
            admin: true,
            suporte: true,
            acesso_geral: true,
        },
    });
    console.log(`✅ Usuário admin criado: ${admin.email}`);
    const fazenda = await prisma.fazenda.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            nome: 'Fazenda Modelo',
            status: 'ATIVO',
            id_usuarios: [admin.id],
            nome_proprietario: 'Admin',
            cidade: 'Goiânia',
            estado: 'GO',
        },
    });
    console.log(`✅ Fazenda inicial criada: ${fazenda.nome}`);
    await prisma.planoMensalidade.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            id_fazenda: fazenda.id,
            id_plano: 1,
            status: 'PAGO',
            valor_pagamento: 50.0,
            data_pagamento: new Date(),
        },
    });
    console.log('🏁 Seed finalizado com sucesso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map