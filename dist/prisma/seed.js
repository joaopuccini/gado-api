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
const client_admin_1 = require("@prisma/client-admin");
const bcrypt = __importStar(require("bcrypt"));
require("dotenv/config");
async function main() {
    console.log('🌱 Iniciando seeding...');
    const adminClient = new client_admin_1.PrismaClient();
    console.log('🔌 Conectado ao schema admin');
    const planos = [
        { nome: 'Trial', maxUsuarios: 1, maxFazendas: 1, precoMensal: 0.0, ativo: true },
        { nome: 'Plano Pro', maxUsuarios: 5, maxFazendas: 3, precoMensal: 199.9, ativo: true },
        { nome: 'Plano Enterprise', maxUsuarios: 99, maxFazendas: 99, precoMensal: 499.9, ativo: true },
    ];
    for (const plano of planos) {
        await adminClient.plano.upsert({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            update: {},
            create: plano,
        }).catch(async () => {
            const exists = await adminClient.plano.findFirst({ where: { nome: plano.nome } });
            if (!exists)
                await adminClient.plano.create({ data: plano });
        });
    }
    console.log('✅ Planos SaaS criados');
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
//# sourceMappingURL=seed.js.map