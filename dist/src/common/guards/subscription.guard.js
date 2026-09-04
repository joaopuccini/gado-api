"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const admin_prisma_service_1 = require("../../admin/admin-prisma.service");
const skip_subscription_decorator_1 = require("./skip-subscription.decorator");
let SubscriptionGuard = class SubscriptionGuard {
    reflector;
    adminPrisma;
    constructor(reflector, adminPrisma) {
        this.reflector = reflector;
        this.adminPrisma = adminPrisma;
    }
    async canActivate(context) {
        const skipCheck = this.reflector.getAllAndOverride(skip_subscription_decorator_1.SKIP_SUBSCRIPTION_CHECK, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipCheck) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.tenantId) {
            return true;
        }
        const tenantRegistry = await this.adminPrisma.tenantRegistry.findUnique({
            where: { id: user.tenantId },
            include: { organizacao: { include: { assinaturas: true } } },
        });
        if (!tenantRegistry || tenantRegistry.status !== 'ATIVO') {
            throw new common_1.ForbiddenException('Organização inativa ou suspensa');
        }
        const assinatura = tenantRegistry.organizacao.assinaturas.find((sub) => sub.status === 'ATIVA');
        if (!assinatura) {
            throw new common_1.ForbiddenException('Nenhuma assinatura ativa encontrada para esta organização');
        }
        if (assinatura.dataVencimento < new Date()) {
            throw new common_1.ForbiddenException('A assinatura expirou. Renove para continuar utilizando a plataforma.');
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        admin_prisma_service_1.AdminPrismaService])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map