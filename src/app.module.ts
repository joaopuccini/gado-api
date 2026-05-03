import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';

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
import { KilosModule } from './kilos/kilos.module';
import { VacinacaoModule } from './vacinacao/vacinacao.module';
import { ManejoModule } from './manejo/manejo.module';
import { MovimentacoesModule } from './movimentacoes/movimentacoes.module';
import { FotosModule } from './fotos/fotos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FazendasModule } from './fazendas/fazendas.module';
import { PlanosModule } from './planos/planos.module';
import { MensalidadesModule } from './mensalidades/mensalidades.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    }]),

    PrismaModule,
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
    KilosModule,
    VacinacaoModule,
    ManejoModule,
    MovimentacoesModule,
    FotosModule,
    DashboardModule,
    FazendasModule,
    PlanosModule,
    MensalidadesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
