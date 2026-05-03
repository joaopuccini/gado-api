"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManejoModule = void 0;
const common_1 = require("@nestjs/common");
const manejo_controller_1 = require("./manejo.controller");
const manejo_service_1 = require("./manejo.service");
let ManejoModule = class ManejoModule {
};
exports.ManejoModule = ManejoModule;
exports.ManejoModule = ManejoModule = __decorate([
    (0, common_1.Module)({ controllers: [manejo_controller_1.ManejoController], providers: [manejo_service_1.ManejoService], exports: [manejo_service_1.ManejoService] })
], ManejoModule);
//# sourceMappingURL=manejo.module.js.map