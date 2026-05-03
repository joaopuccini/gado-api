"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RacasModule = void 0;
const common_1 = require("@nestjs/common");
const racas_controller_1 = require("./racas.controller");
const racas_service_1 = require("./racas.service");
let RacasModule = class RacasModule {
};
exports.RacasModule = RacasModule;
exports.RacasModule = RacasModule = __decorate([
    (0, common_1.Module)({ controllers: [racas_controller_1.RacasController], providers: [racas_service_1.RacasService], exports: [racas_service_1.RacasService] })
], RacasModule);
//# sourceMappingURL=racas.module.js.map