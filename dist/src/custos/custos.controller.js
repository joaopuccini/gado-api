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
exports.CustosTipoController = exports.CustosController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const custos_service_1 = require("./custos.service");
const custo_dto_1 = require("./dto/custo.dto");
const dto_1 = require("../common/dto");
let CustosController = class CustosController {
    custoService;
    constructor(custoService) {
        this.custoService = custoService;
    }
    async createCusto(dto) {
        const response = await this.custoService.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }
    async findAll(p) {
        const data = await this.custoService.findAll({ skip: p.skip, take: p.limit, include: { custoTipo: true } });
        return { sucesso: true, data };
    }
    async findOne(id) {
        const data = await this.custoService.findOne(id);
        return { sucesso: true, data };
    }
    async removeCusto(id) {
        const data = await this.custoService.remove(id);
        return { sucesso: true, data };
    }
};
exports.CustosController = CustosController;
__decorate([
    (0, common_1.Post)('cadastrar'),
    (0, swagger_1.ApiOperation)({ summary: 'Lançar custo (distribuído entre animais)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custo_dto_1.CreateCustoDto]),
    __metadata("design:returntype", Promise)
], CustosController.prototype, "createCusto", null);
__decorate([
    (0, common_1.Get)('buscar'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar custos' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], CustosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('buscarum/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar um custo' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CustosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)('deletar/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir custo' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CustosController.prototype, "removeCusto", null);
exports.CustosController = CustosController = __decorate([
    (0, swagger_1.ApiTags)('Custos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('custos'),
    __metadata("design:paramtypes", [custos_service_1.CustosService])
], CustosController);
let CustosTipoController = class CustosTipoController {
    tipoService;
    constructor(tipoService) {
        this.tipoService = tipoService;
    }
    async createTipo(dto) {
        const response = await this.tipoService.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }
    async findTipos(p) {
        const data = await this.tipoService.findAll({ skip: p.skip, take: p.limit });
        return { sucesso: true, data };
    }
};
exports.CustosTipoController = CustosTipoController;
__decorate([
    (0, common_1.Post)('cadastrar'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar tipo de custo' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custo_dto_1.CreateCustoTipoDto]),
    __metadata("design:returntype", Promise)
], CustosTipoController.prototype, "createTipo", null);
__decorate([
    (0, common_1.Get)('buscar'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar tipos de custo' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], CustosTipoController.prototype, "findTipos", null);
exports.CustosTipoController = CustosTipoController = __decorate([
    (0, swagger_1.ApiTags)('Custos Tipo'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('custos_tipo'),
    __metadata("design:paramtypes", [custos_service_1.CustoTiposService])
], CustosTipoController);
//# sourceMappingURL=custos.controller.js.map