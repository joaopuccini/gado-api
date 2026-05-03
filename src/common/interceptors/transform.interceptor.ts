import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { RequestContext } from '../context';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta: {
        requestId: string;
        timestamp: string;
        path: string;
    };
}

/**
 * Transforma todas as respostas em um envelope padrão:
 * { success: true, data: {...}, meta: { requestId, timestamp, path } }
 *
 * Mantém consistência com o formato original do Express:
 * { sucesso: true, data: response }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const req = context.switchToHttp().getRequest();
        const ctx = RequestContext.get();

        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                meta: {
                    requestId: ctx?.requestId || 'unknown',
                    timestamp: new Date().toISOString(),
                    path: req.originalUrl,
                },
            })),
        );
    }
}
