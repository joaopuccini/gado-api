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
exports.ManejoController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const manejo_service_1 = require("./manejo.service");
const manejo_dto_1 = require("./dto/manejo.dto");
const dto_1 = require("../common/dto");
let ManejoController = class ManejoController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const response = await this.service.create(dto);
        return response;
    }
    async findAll(p) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, boi: true } });
        return data;
    }
    async findOne(id) {
        const data = await this.service.findOne(id, { animal: true, boi: true });
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
exports.ManejoController = ManejoController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar manejo' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manejo_dto_1.CreateManejoDto]),
    __metadata("design:returntype", Promise)
], ManejoController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar manejos' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ManejoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar manejo' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ManejoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar manejo' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, manejo_dto_1.UpdateManejoDto]),
    __metadata("design:returntype", Promise)
], ManejoController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir manejo' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ManejoController.prototype, "remove", null);
exports.ManejoController = ManejoController = __decorate([
    (0, swagger_1.ApiTags)('Manejo'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('manejos'),
    __metadata("design:paramtypes", [manejo_service_1.ManejoService])
], ManejoController);
//# sourceMappingURL=manejo.controller.js.map