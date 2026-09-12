import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { StructuredLogger } from './common/logger/structured-logger.service';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const structuredLogger = app.get(StructuredLogger);
  app.useLogger(structuredLogger);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8080);
  const prefix = configService.get<string>('API_PREFIX', '');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');

  // Global prefix (mantém compatibilidade: sem prefix = mesmas rotas do Express)
  if (prefix) {
    app.setGlobalPrefix(prefix);
  }

  // Security headers
  app.use(helmet());

  // CORS restritivo
  app.enableCors({
    origin:
      corsOrigins === '*' ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Swagger (OpenAPI)
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gado API')
      .setDescription('API de Gerenciamento de Gado e Manejo de Fazenda')
      .setVersion('2.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(port);
  structuredLogger.info('applicationStarted', { port });
  structuredLogger.info('swaggerAvailable', { path: '/api-docs' });
}

void bootstrap();
