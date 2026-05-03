import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from './request-context';

/**
 * Middleware that initializes AsyncLocalStorage context for every request.
 * Must be the FIRST middleware in the chain.
 *
 * Sets: requestId, path, method, startTime
 * Later enriched by JwtAuthGuard with: userId, fazendaId
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const requestId = (req.headers['x-request-id'] as string) || uuidv4();

        // Set header for downstream tracing
        res.setHeader('x-request-id', requestId);

        RequestContext.run(
            {
                requestId,
                path: req.originalUrl,
                method: req.method,
                startTime: Date.now(),
            },
            () => next(),
        );
    }
}
