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
const create_plano_dto_1 = require("./dto/create-plano.dto");
const update_plano_dto_1 = require("./dto/update-plano.dto");
let PlanosController = class PlanosController {
    planosService;
    constructor(planosService) {
        this.planosService = planosService;
    }
    create(createPlanoDto) {
        return this.planosService.create(createPlanoDto);
    }
    findAll() {
        return this.planosService.findAll();
    }
    findOne(id) {
        return this.planosService.findOne(id);
    }
    update(id, updatePlanoDto) {
        return this.planosService.update(id, updatePlanoDto);
    }
    remove(id) {
        return this.planosService.remove(id);
    }
};
exports.PlanosController = PlanosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_plano_dto_1.CreatePlanoDto]),
    __metadata("design:returntype", void 0)
], PlanosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlanosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlanosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_plano_dto_1.UpdatePlanoDto]),
    __metadata("design:returntype", void 0)
], PlanosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlanosController.prototype, "remove", null);
exports.PlanosController = PlanosController = __decorate([
    (0, common_1.Controller)('admin/planos'),
    __metadata("design:paramtypes", [planos_service_1.PlanosService])
], PlanosController);
//# sourceMappingURL=planos.controller.js.map