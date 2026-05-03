"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacoesModule = void 0;
const common_1 = require("@nestjs/common");
const movimentacoes_controller_1 = require("./movimentacoes.controller");
const movimentacoes_service_1 = require("./movimentacoes.service");
let MovimentacoesModule = class MovimentacoesModule {
};
exports.MovimentacoesModule = MovimentacoesModule;
exports.MovimentacoesModule = MovimentacoesModule = __decorate([
    (0, common_1.Module)({
        controllers: [movimentacoes_controller_1.MovimentoPastoController, movimentacoes_controller_1.MovimentoLoteController],
        providers: [movimentacoes_service_1.MovimentoPastoService, movimentacoes_service_1.MovimentoLoteService],
        exports: [movimentacoes_service_1.MovimentoPastoService, movimentacoes_service_1.MovimentoLoteService],
    })
], MovimentacoesModule);
//# sourceMappingURL=movimentacoes.module.js.map