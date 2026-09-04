import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from '../context/request-context';
import { globalTenantPrismaService } from '../../tenant/tenant-prisma.service';

@Injectable()
export class HierarchyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const fazendaId = RequestContext.getFazendaId();

    if (fazendaId && globalTenantPrismaService) {
      try {
        const prisma = globalTenantPrismaService.getClient();
        
        // Find daughter farms
        const filhas = await prisma.fazenda.findMany({
          where: { parentId: fazendaId, ativo: true },
          select: { id: true },
        });

        const filhasIds = filhas.map((f: { id: number }) => f.id);
        const accessibleFazendaIds = [fazendaId, ...filhasIds];

        RequestContext.set({ accessibleFazendaIds });
      } catch (error) {
        console.error('Error fetching farm hierarchy', error);
      }
    }

    return next.handle();
  }
}
