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
exports.AnimaisController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const animais_service_1 = require("./animais.service");
const animal_dto_1 = require("./dto/animal.dto");
const dto_1 = require("../common/dto");
let AnimaisController = class AnimaisController {
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
exports.AnimaisController = AnimaisController;
__decorate([
    (0, common_1.Post)('cadastrar'),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastrar animal' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [animal_dto_1.CreateAnimalDto]),
    __metadata("design:returntype", Promise)
], AnimaisController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('buscar'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar animais (com paginação e relações)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AnimaisController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buscarum/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar animal por ID (detalhes completos)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnimaisController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('editar/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar animal' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, animal_dto_1.UpdateAnimalDto]),
    __metadata("design:returntype", Promise)
], AnimaisController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('deletar/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir animal' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnimaisController.prototype, "remove", null);
exports.AnimaisController = AnimaisController = __decorate([
    (0, swagger_1.ApiTags)('Animais'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('animais'),
    __metadata("design:paramtypes", [animais_service_1.AnimaisService])
], AnimaisController);
//# sourceMappingURL=animais.controller.js.map