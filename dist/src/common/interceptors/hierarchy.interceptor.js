"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../context/request-context");
const tenant_prisma_service_1 = require("../../tenant/tenant-prisma.service");
let HierarchyInterceptor = class HierarchyInterceptor {
    async intercept(context, next) {
        const fazendaId = request_context_1.RequestContext.getFazendaId();
        if (fazendaId && tenant_prisma_service_1.globalTenantPrismaService) {
            try {
                const prisma = tenant_prisma_service_1.globalTenantPrismaService.getClient();
                const filhas = await prisma.fazenda.findMany({
                    where: { parentId: fazendaId, ativo: true },
                    select: { id: true },
                });
                const filhasIds = filhas.map((f) => f.id);
                const accessibleFazendaIds = [fazendaId, ...filhasIds];
                request_context_1.RequestContext.set({ accessibleFazendaIds });
            }
            catch (error) {
                console.error('Error fetching farm hierarchy', error);
            }
        }
        return next.handle();
    }
};
exports.HierarchyInterceptor = HierarchyInterceptor;
exports.HierarchyInterceptor = HierarchyInterceptor = __decorate([
    (0, common_1.Injectable)()
], HierarchyInterceptor);
//# sourceMappingURL=hierarchy.interceptor.js.map