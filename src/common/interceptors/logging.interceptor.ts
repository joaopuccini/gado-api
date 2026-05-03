import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestContext } from '../context';

/**
 * Interceptor de Logging — rastreabilidade completa.
 *
 * LOG 1 (entrada): [ReqId:abc] → POST /animais — mostra o path/service solicitado
 * LOG 2 (saída):   [ReqId:abc] ← POST /animais 201 [45ms] — mostra o resultado
 *
 * Cada request tem um requestId único que permite rastrear
 * toda a cadeia de logs daquela operação.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest();
        const { method, originalUrl, ip } = req;
        const ctx = RequestContext.get();
        const requestId = ctx?.requestId?.substring(0, 8) || '--------';
        const controller = context.getClass().name;
        const handler = context.getHandler().name;

        // LOG 1: Request entrada — mostra o serviço/path solicitado
        this.logger.log(
            `[ReqId:${requestId}] → ${method} ${originalUrl} | ${controller}.${handler} | IP:${ip}`,
        );

        return next.handle().pipe(
            tap({
                next: () => {
                    const res = context.switchToHttp().getResponse();
                    const duration = ctx ? Date.now() - ctx.startTime : 0;

                    // LOG 2: Response saída — mostra resultado + tempo
                    this.logger.log(
                        `[ReqId:${requestId}] ← ${method} ${originalUrl} ${res.statusCode} [${duration}ms]`,
                    );
                },
                error: (error) => {
                    const duration = ctx ? Date.now() - ctx.startTime : 0;
                    const status = error?.status || error?.getStatus?.() || 500;

                    // LOG ERROR: Falha — mostra erro + tempo
                    this.logger.error(
                        `[ReqId:${requestId}] ✗ ${method} ${originalUrl} ${status} [${duration}ms] | ${error?.message}`,
                    );
                },
            }),
        );
    }
}
