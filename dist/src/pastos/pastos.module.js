"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PastosModule = void 0;
const common_1 = require("@nestjs/common");
const pastos_controller_1 = require("./pastos.controller");
const pastos_service_1 = require("./pastos.service");
let PastosModule = class PastosModule {
};
exports.PastosModule = PastosModule;
exports.PastosModule = PastosModule = __decorate([
    (0, common_1.Module)({ controllers: [pastos_controller_1.PastosController], providers: [pastos_service_1.PastosService], exports: [pastos_service_1.PastosService] })
], PastosModule);
//# sourceMappingURL=pastos.module.js.map