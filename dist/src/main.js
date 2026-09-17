"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const structured_logger_service_1 = require("./common/logger/structured-logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const structuredLogger = app.get(structured_logger_service_1.StructuredLogger);
    app.useLogger(structuredLogger);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 8080);
    const prefix = configService.get('API_PREFIX', '');
    const corsOrigins = configService.get('CORS_ORIGINS', '*');
    if (prefix) {
        app.setGlobalPrefix(prefix);
    }
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    if (configService.get('NODE_ENV') !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Gado API')
            .setDescription('API de Gerenciamento de Gado e Manejo de Fazenda')
            .setVersion('2.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api-docs', app, document);
    }
    await app.listen(port);
    structuredLogger.info('applicationStarted', { port });
    structuredLogger.info('swaggerAvailable', { path: '/api-docs' });
}
void bootstrap();
//# sourceMappingURL=main.js.map