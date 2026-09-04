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
exports.PastosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pastos_service_1 = require("./pastos.service");
const pasto_dto_1 = require("./dto/pasto.dto");
const dto_1 = require("../common/dto");
let PastosController = class PastosController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const response = await this.service.create(dto);
        return response;
    }
    async findAll(p) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return data;
    }
    async findOne(id) {
        const data = await this.service.findOne(id);
        return data;
    }
    async update(id, dto) {
        const data = await this.service.update(id, dto);
        return data;
    }
    async remove(id) {
        const data = await this.service.remove(id);
        return data;
    }
};
exports.PastosController = PastosController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar pasto' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pasto_dto_1.CreatePastoDto]),
    __metadata("design:returntype", Promise)
], PastosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pastos' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], PastosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar pasto' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PastosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar pasto' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pasto_dto_1.UpdatePastoDto]),
    __metadata("design:returntype", Promise)
], PastosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir pasto' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PastosController.prototype, "remove", null);
exports.PastosController = PastosController = __decorate([
    (0, swagger_1.ApiTags)('Pastos'),
    (0, common_1.Controller)('pastos'),
    __metadata("design:paramtypes", [pastos_service_1.PastosService])
], PastosController);
//# sourceMappingURL=pastos.controller.js.map