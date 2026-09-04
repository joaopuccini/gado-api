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
exports.MovimentoLoteController = exports.MovimentoPastoController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const movimentacoes_service_1 = require("./movimentacoes.service");
const movimentacao_dto_1 = require("./dto/movimentacao.dto");
const dto_1 = require("../common/dto");
let MovimentoPastoController = class MovimentoPastoController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const response = await this.service.create(dto);
        return response;
    }
    async findAll(p) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, pastoOrigem: true, pastoDestino: true } });
        return data;
    }
};
exports.MovimentoPastoController = MovimentoPastoController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mover animal de pasto' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [movimentacao_dto_1.CreateMovPastoDto]),
    __metadata("design:returntype", Promise)
], MovimentoPastoController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar movimentos de pasto' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], MovimentoPastoController.prototype, "findAll", null);
exports.MovimentoPastoController = MovimentoPastoController = __decorate([
    (0, swagger_1.ApiTags)('Movimentações Pasto'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('movimento_animal_pasto'),
    __metadata("design:paramtypes", [movimentacoes_service_1.MovimentoPastoService])
], MovimentoPastoController);
let MovimentoLoteController = class MovimentoLoteController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const response = await this.service.create(dto);
        return response;
    }
    async findAll(p) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, loteOrigem: true, loteDestino: true } });
        return data;
    }
};
exports.MovimentoLoteController = MovimentoLoteController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mover animal de lote' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [movimentacao_dto_1.CreateMovLoteDto]),
    __metadata("design:returntype", Promise)
], MovimentoLoteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar movimentos de lote' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], MovimentoLoteController.prototype, "findAll", null);
exports.MovimentoLoteController = MovimentoLoteController = __decorate([
    (0, swagger_1.ApiTags)('Movimentações Lote'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('movimento_lote'),
    __metadata("design:paramtypes", [movimentacoes_service_1.MovimentoLoteService])
], MovimentoLoteController);
//# sourceMappingURL=movimentacoes.controller.js.map