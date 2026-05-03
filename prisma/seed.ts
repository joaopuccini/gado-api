import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('🌱 Iniciando seeding...');

    // 1. Criar Planos (SaaS)
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

    // 2. Criar Usuário Admin Default
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

    // 3. Criar uma Fazenda de Exemplo para o Admin
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

    // 4. Criar a mensalidade inicial da fazenda
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
