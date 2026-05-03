"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustosModule = void 0;
const common_1 = require("@nestjs/common");
const custos_controller_1 = require("./custos.controller");
const custos_service_1 = require("./custos.service");
let CustosModule = class CustosModule {
};
exports.CustosModule = CustosModule;
exports.CustosModule = CustosModule = __decorate([
    (0, common_1.Module)({
        controllers: [custos_controller_1.CustosController, custos_controller_1.CustosTipoController],
        providers: [custos_service_1.CustosService, custos_service_1.CustoTiposService],
        exports: [custos_service_1.CustosService, custos_service_1.CustoTiposService],
    })
], CustosModule);
//# sourceMappingURL=custos.module.js.map