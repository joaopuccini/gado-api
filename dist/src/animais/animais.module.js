"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimaisModule = void 0;
const common_1 = require("@nestjs/common");
const animais_controller_1 = require("./animais.controller");
const animais_service_1 = require("./animais.service");
let AnimaisModule = class AnimaisModule {
};
exports.AnimaisModule = AnimaisModule;
exports.AnimaisModule = AnimaisModule = __decorate([
    (0, common_1.Module)({
        controllers: [animais_controller_1.AnimaisController],
        providers: [animais_service_1.AnimaisService],
        exports: [animais_service_1.AnimaisService],
    })
], AnimaisModule);
//# sourceMappingURL=animais.module.js.map