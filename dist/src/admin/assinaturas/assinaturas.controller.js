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
exports.AssinaturasController = void 0;
const common_1 = require("@nestjs/common");
const assinaturas_service_1 = require("./assinaturas.service");
const create_assinatura_dto_1 = require("./dto/create-assinatura.dto");
const update_assinatura_dto_1 = require("./dto/update-assinatura.dto");
let AssinaturasController = class AssinaturasController {
    assinaturasService;
    constructor(assinaturasService) {
        this.assinaturasService = assinaturasService;
    }
    create(createAssinaturaDto) {
        return this.assinaturasService.create(createAssinaturaDto);
    }
    findAll() {
        return this.assinaturasService.findAll();
    }
    findOne(id) {
        return this.assinaturasService.findOne(id);
    }
    update(id, updateAssinaturaDto) {
        return this.assinaturasService.update(id, updateAssinaturaDto);
    }
    remove(id) {
        return this.assinaturasService.remove(id);
    }
    registrarBaixa(pagamentoId, valorPago) {
        return this.assinaturasService.registrarPagamento(pagamentoId, valorPago);
    }
};
exports.AssinaturasController = AssinaturasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_assinatura_dto_1.CreateAssinaturaDto]),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_assinatura_dto_1.UpdateAssinaturaDto]),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('pagamentos/:pagamentoId/baixar'),
    __param(0, (0, common_1.Param)('pagamentoId')),
    __param(1, (0, common_1.Body)('valorPago')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AssinaturasController.prototype, "registrarBaixa", null);
exports.AssinaturasController = AssinaturasController = __decorate([
    (0, common_1.Controller)('admin/assinaturas'),
    __metadata("design:paramtypes", [assinaturas_service_1.AssinaturasService])
], AssinaturasController);
//# sourceMappingURL=assinaturas.controller.js.map