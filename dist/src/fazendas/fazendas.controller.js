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
exports.FazendasController = void 0;
const common_1 = require("@nestjs/common");
const fazendas_service_1 = require("./fazendas.service");
let FazendasController = class FazendasController {
    fazendasService;
    constructor(fazendasService) {
        this.fazendasService = fazendasService;
    }
    async findAll() {
        const data = await this.fazendasService.findAll();
        return data;
    }
    async findOne(id) {
        const data = await this.fazendasService.findOne(id);
        return data;
    }
    async findByUserId(usuarioId) {
        const data = await this.fazendasService.findByUserId(usuarioId);
        return data;
    }
    async create(data) {
        const response = await this.fazendasService.create(data);
        return response;
    }
    async update(id, data) {
        const dataResponse = await this.fazendasService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }
    async remove(id) {
        const data = await this.fazendasService.remove(id);
        return data;
    }
};
exports.FazendasController = FazendasController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('buscar_fazendas_usuario'),
    __param(0, (0, common_1.Query)('usuarioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "findByUserId", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FazendasController.prototype, "remove", null);
exports.FazendasController = FazendasController = __decorate([
    (0, common_1.Controller)('fazendas'),
    __metadata("design:paramtypes", [fazendas_service_1.FazendasService])
], FazendasController);
//# sourceMappingURL=fazendas.controller.js.map