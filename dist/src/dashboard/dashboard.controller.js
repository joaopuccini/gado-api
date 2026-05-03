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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getStats() {
        return this.service.getStats();
    }
    async getTotalMachoFemea() {
        return this.service.getTotalMachoFemea();
    }
    async getTotalCusto() {
        const data = await this.service.getTotalCustoAnimaisComCusto();
        return { sucesso: true, data };
    }
    async getTotalLPRC(query) {
        const data = await this.service.getTotalLotesPastosRacasClientesAtivos(query);
        return { sucesso: true, data };
    }
    async getTotalTipoCusto() {
        return this.service.getTotalPorTipoCusto();
    }
    async getTotal12Meses() {
        const data = await this.service.getTotalCusto12Meses();
        return { sucesso: true, data };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estatísticas básicas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('total_machos_femeas'),
    (0, swagger_1.ApiOperation)({ summary: 'Total de machos e fêmeas ativos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTotalMachoFemea", null);
__decorate([
    (0, common_1.Get)('total'),
    (0, swagger_1.ApiOperation)({ summary: 'Total de custo acumulado' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTotalCusto", null);
__decorate([
    (0, common_1.Get)('total_lprc_ativos'),
    (0, swagger_1.ApiOperation)({ summary: 'Total de lotes, pastos, raças e clientes ativos' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTotalLPRC", null);
__decorate([
    (0, common_1.Get)('total_tipo_custo'),
    (0, swagger_1.ApiOperation)({ summary: 'Total por tipo de custo' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTotalTipoCusto", null);
__decorate([
    (0, common_1.Get)('total_12_meses'),
    (0, swagger_1.ApiOperation)({ summary: 'Total de custo nos últimos 12 meses' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTotal12Meses", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map