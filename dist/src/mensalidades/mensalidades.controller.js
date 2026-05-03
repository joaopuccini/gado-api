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
exports.MensalidadesController = void 0;
const common_1 = require("@nestjs/common");
const mensalidades_service_1 = require("./mensalidades.service");
let MensalidadesController = class MensalidadesController {
    mensalidadesService;
    constructor(mensalidadesService) {
        this.mensalidadesService = mensalidadesService;
    }
    async findAll() {
        const data = await this.mensalidadesService.findAll();
        return { sucesso: true, data };
    }
    async findOne(id) {
        const data = await this.mensalidadesService.findOne(id);
        return { sucesso: true, data };
    }
    async create(data) {
        const response = await this.mensalidadesService.create(data);
        return { message: 'Sucesso ao cadastrar!', response };
    }
    async update(id, data) {
        const dataResponse = await this.mensalidadesService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }
    async remove(id) {
        const data = await this.mensalidadesService.remove(id);
        return { sucesso: true, data };
    }
};
exports.MensalidadesController = MensalidadesController;
__decorate([
    (0, common_1.Get)('buscar'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MensalidadesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buscarum/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MensalidadesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('cadastrar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MensalidadesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('editar/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MensalidadesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('deletar/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MensalidadesController.prototype, "remove", null);
exports.MensalidadesController = MensalidadesController = __decorate([
    (0, common_1.Controller)('plano_mensalidades'),
    __metadata("design:paramtypes", [mensalidades_service_1.MensalidadesService])
], MensalidadesController);
//# sourceMappingURL=mensalidades.controller.js.map