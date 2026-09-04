"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const tenant_module_1 = require("./tenant/tenant.module");
const request_context_middleware_1 = require("./common/context/request-context.middleware");
const filters_1 = require("./common/filters");
const interceptors_1 = require("./common/interceptors");
const subscription_guard_1 = require("./common/guards/subscription.guard");
const auth_module_1 = require("./auth/auth.module");
const animais_module_1 = require("./animais/animais.module");
const lotes_module_1 = require("./lotes/lotes.module");
const racas_module_1 = require("./racas/racas.module");
const pastos_module_1 = require("./pastos/pastos.module");
const clientes_module_1 = require("./clientes/clientes.module");
const custos_module_1 = require("./custos/custos.module");
const vendas_module_1 = require("./vendas/vendas.module");
const caixa_module_1 = require("./caixa/caixa.module");
const vacinacao_module_1 = require("./vacinacao/vacinacao.module");
const manejo_module_1 = require("./manejo/manejo.module");
const movimentacoes_module_1 = require("./movimentacoes/movimentacoes.module");
const fotos_module_1 = require("./fotos/fotos.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const admin_module_1 = require("./admin/admin.module");
const almoxarifados_module_1 = require("./suprimentos/almoxarifados/almoxarifados.module");
const produtos_module_1 = require("./suprimentos/produtos/produtos.module");
const fornecedores_module_1 = require("./suprimentos/fornecedores/fornecedores.module");
const movimento_estoque_module_1 = require("./suprimentos/movimento-estoque/movimento-estoque.module");
const pedidos_compra_module_1 = require("./suprimentos/pedidos-compra/pedidos-compra.module");
const contas_bancarias_module_1 = require("./financeiro/contas-bancarias/contas-bancarias.module");
const contas_pagar_module_1 = require("./financeiro/contas-pagar/contas-pagar.module");
const contas_receber_module_1 = require("./financeiro/contas-receber/contas-receber.module");
const transacoes_bancarias_module_1 = require("./financeiro/transacoes-bancarias/transacoes-bancarias.module");
const safras_module_1 = require("./frota/safras/safras.module");
const maquinas_module_1 = require("./frota/maquinas/maquinas.module");
const abastecimentos_module_1 = require("./frota/abastecimentos/abastecimentos.module");
const manutencoes_module_1 = require("./frota/manutencoes/manutencoes.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_context_middleware_1.RequestContextMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
                    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
                }]),
            prisma_module_1.PrismaModule,
            tenant_module_1.TenantModule,
            auth_module_1.AuthModule,
            animais_module_1.AnimaisModule,
            lotes_module_1.LotesModule,
            racas_module_1.RacasModule,
            pastos_module_1.PastosModule,
            clientes_module_1.ClientesModule,
            custos_module_1.CustosModule,
            vendas_module_1.VendasModule,
            caixa_module_1.CaixaModule,
            vacinacao_module_1.VacinacaoModule,
            manejo_module_1.ManejoModule,
            movimentacoes_module_1.MovimentacoesModule,
            fotos_module_1.FotosModule,
            dashboard_module_1.DashboardModule,
            admin_module_1.AdminModule,
            almoxarifados_module_1.AlmoxarifadosModule,
            produtos_module_1.ProdutosModule,
            fornecedores_module_1.FornecedoresModule,
            movimento_estoque_module_1.MovimentoEstoqueModule,
            pedidos_compra_module_1.PedidosCompraModule,
            contas_bancarias_module_1.ContasBancariasModule,
            contas_pagar_module_1.ContasPagarModule,
            contas_receber_module_1.ContasReceberModule,
            transacoes_bancarias_module_1.TransacoesBancariasModule,
            safras_module_1.SafrasModule,
            maquinas_module_1.MaquinasModule,
            abastecimentos_module_1.AbastecimentosModule,
            manutencoes_module_1.ManutencoesModule,
        ],
        providers: [
            { provide: core_1.APP_FILTER, useClass: filters_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: interceptors_1.LoggingInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: interceptors_1.HierarchyInterceptor },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: subscription_guard_1.SubscriptionGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map