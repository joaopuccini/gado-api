import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

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
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validation pipe global — equivalente ao ControllerAdvice de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

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
  Logger.log(`🐂 Gado API running on port ${port}`, 'Bootstrap');
  Logger.log(`📄 Swagger: http://localhost:${port}/api-docs`, 'Bootstrap');
}

bootstrap();
