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
exports.RacasController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const racas_service_1 = require("./racas.service");
const raca_dto_1 = require("./dto/raca.dto");
const dto_1 = require("../common/dto");
let RacasController = class RacasController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }
    async findAll(p) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return { sucesso: true, data };
    }
    async findOne(id) {
        const data = await this.service.findOne(id);
        return { sucesso: true, data };
    }
    async update(id, dto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }
    async remove(id) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
};
exports.RacasController = RacasController;
__decorate([
    (0, common_1.Post)('cadastrar'),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar raça' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [raca_dto_1.CreateRacaDto]),
    __metadata("design:returntype", Promise)
], RacasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('buscar'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar raças' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], RacasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buscarum/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar raça por ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RacasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('editar/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar raça' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, raca_dto_1.UpdateRacaDto]),
    __metadata("design:returntype", Promise)
], RacasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('deletar/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir raça' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RacasController.prototype, "remove", null);
exports.RacasController = RacasController = __decorate([
    (0, swagger_1.ApiTags)('Raças'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('racas'),
    __metadata("design:paramtypes", [racas_service_1.RacasService])
], RacasController);
//# sourceMappingURL=racas.controller.js.map