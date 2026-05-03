"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KilosModule = void 0;
const common_1 = require("@nestjs/common");
const kilos_controller_1 = require("./kilos.controller");
const kilos_service_1 = require("./kilos.service");
let KilosModule = class KilosModule {
};
exports.KilosModule = KilosModule;
exports.KilosModule = KilosModule = __decorate([
    (0, common_1.Module)({ controllers: [kilos_controller_1.KilosController], providers: [kilos_service_1.KilosService], exports: [kilos_service_1.KilosService] })
], KilosModule);
//# sourceMappingURL=kilos.module.js.map