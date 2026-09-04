"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_prisma_service_1 = require("./admin-prisma.service");
const planos_controller_1 = require("./planos/planos.controller");
const planos_service_1 = require("./planos/planos.service");
const organizacoes_controller_1 = require("./organizacoes/organizacoes.controller");
const organizacoes_service_1 = require("./organizacoes/organizacoes.service");
const assinaturas_controller_1 = require("./assinaturas/assinaturas.controller");
const assinaturas_service_1 = require("./assinaturas/assinaturas.service");
const admin_usuarios_controller_1 = require("./usuarios/admin-usuarios.controller");
const admin_usuarios_service_1 = require("./usuarios/admin-usuarios.service");
const auth_module_1 = require("../auth/auth.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => auth_module_1.AuthModule)],
        controllers: [
            planos_controller_1.PlanosController,
            organizacoes_controller_1.OrganizacoesController,
            assinaturas_controller_1.AssinaturasController,
            admin_usuarios_controller_1.AdminUsuariosController,
        ],
        providers: [
            admin_prisma_service_1.AdminPrismaService,
            planos_service_1.PlanosService,
            organizacoes_service_1.OrganizacoesService,
            assinaturas_service_1.AssinaturasService,
            admin_usuarios_service_1.AdminUsuariosService,
        ],
        exports: [admin_prisma_service_1.AdminPrismaService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map