import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor, HierarchyInterceptor } from './common/interceptors';
import { SubscriptionGuard } from './common/guards/subscription.guard';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { AnimaisModule } from './animais/animais.module';
import { LotesModule } from './lotes/lotes.module';
import { RacasModule } from './racas/racas.module';
import { PastosModule } from './pastos/pastos.module';
import { ClientesModule } from './clientes/clientes.module';
import { CustosModule } from './custos/custos.module';
import { VendasModule } from './vendas/vendas.module';
import { CaixaModule } from './caixa/caixa.module';
import { VacinacaoModule } from './vacinacao/vacinacao.module';
import { ManejoModule } from './manejo/manejo.module';
import { MovimentacoesModule } from './movimentacoes/movimentacoes.module';
import { FotosModule } from './fotos/fotos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { AlmoxarifadosModule } from './suprimentos/almoxarifados/almoxarifados.module';
import { ProdutosModule } from './suprimentos/produtos/produtos.module';
import { FornecedoresModule } from './suprimentos/fornecedores/fornecedores.module';
import { MovimentoEstoqueModule } from './suprimentos/movimento-estoque/movimento-estoque.module';
import { PedidosCompraModule } from './suprimentos/pedidos-compra/pedidos-compra.module';
import { ContasBancariasModule } from './financeiro/contas-bancarias/contas-bancarias.module';
import { ContasPagarModule } from './financeiro/contas-pagar/contas-pagar.module';
import { ContasReceberModule } from './financeiro/contas-receber/contas-receber.module';
import { TransacoesBancariasModule } from './financeiro/transacoes-bancarias/transacoes-bancarias.module';
import { SafrasModule } from './frota/safras/safras.module';
import { MaquinasModule } from './frota/maquinas/maquinas.module';
import { AbastecimentosModule } from './frota/abastecimentos/abastecimentos.module';
import { ManutencoesModule } from './frota/manutencoes/manutencoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    }]),

    PrismaModule,
    TenantModule,
    AuthModule,

    // Domain Modules
    AnimaisModule,
    LotesModule,
    RacasModule,
    PastosModule,
    ClientesModule,
    CustosModule,
    VendasModule,
    CaixaModule,
    VacinacaoModule,
    ManejoModule,
    MovimentacoesModule,
    FotosModule,
    DashboardModule,
    AdminModule,
    AlmoxarifadosModule,
    ProdutosModule,
    FornecedoresModule,
    MovimentoEstoqueModule,
    PedidosCompraModule,
    ContasBancariasModule,
    ContasPagarModule,
    ContasReceberModule,
    TransacoesBancariasModule,
    SafrasModule,
    MaquinasModule,
    AbastecimentosModule,
    ManutencoesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HierarchyInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
