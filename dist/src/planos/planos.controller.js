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
exports.PlanosController = void 0;
const common_1 = require("@nestjs/common");
const planos_service_1 = require("./planos.service");
let PlanosController = class PlanosController {
    planosService;
    constructor(planosService) {
        this.planosService = planosService;
    }
    async findAll() {
        const data = await this.planosService.findAll();
        return { sucesso: true, data };
    }
    async findOne(id) {
        const data = await this.planosService.findOne(id);
        return { sucesso: true, data };
    }
    async create(data) {
        const response = await this.planosService.create(data);
        return { message: 'Sucesso ao cadastrar!', response };
    }
    async update(id, data) {
        const dataResponse = await this.planosService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }
    async remove(id) {
        const data = await this.planosService.remove(id);
        return { sucesso: true, data };
    }
};
exports.PlanosController = PlanosController;
__decorate([
    (0, common_1.Get)('buscar'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlanosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buscarum/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('cadastrar'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlanosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('editar/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PlanosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('deletar/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanosController.prototype, "remove", null);
exports.PlanosController = PlanosController = __decorate([
    (0, common_1.Controller)('planos'),
    __metadata("design:paramtypes", [planos_service_1.PlanosService])
], PlanosController);
//# sourceMappingURL=planos.controller.js.map