import { PrismaClient as TenantPrismaClient } from '@prisma/client';
import { PrismaClient as AdminPrismaClient } from '@prisma/client-admin';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

async function main() {
  console.log('🌱 Iniciando seeding...');

  // --- ADMIN SCHEMA SEEDING ---
  const adminClient = new AdminPrismaClient();
  console.log('🔌 Conectado ao schema admin');

  // 1. Criar Planos (SaaS)
  const planos = [
    { nome: 'Trial', maxUsuarios: 1, maxFazendas: 1, precoMensal: 0.0, ativo: true },
    { nome: 'Plano Pro', maxUsuarios: 5, maxFazendas: 3, precoMensal: 199.9, ativo: true },
    { nome: 'Plano Enterprise', maxUsuarios: 99, maxFazendas: 99, precoMensal: 499.9, ativo: true },
  ];

  for (const plano of planos) {
    await adminClient.plano.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' }, // fake where, upsert on non-unique is tricky if no unique constraint on nome, we'll just create if none exists.
      update: {},
      create: plano,
    }).catch(async () => {
      // Se não tem unique por nome, vamos verificar se existe e criar
      const exists = await adminClient.plano.findFirst({ where: { nome: plano.nome } });
      if (!exists) await adminClient.plano.create({ data: plano });
    });
  }
  console.log('✅ Planos SaaS criados');

  // 2. Criar Global Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const globalAdmin = await adminClient.adminUser.upsert({
    where: { email: 'admin@gado.com.br' },
    update: {},
    create: {
      nome: 'Administrador Global',
      email: 'admin@gado.com.br',
      senhaHash: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Admin global criado: ${globalAdmin.email}`);

  await adminClient.$disconnect();
  console.log('🏁 Seed finalizado com sucesso! \nNota: O provisionamento de clientes é automático via SocialProvisioningService no primeiro login com Google (ex: joaoppuccini@gmail.com).');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  });
