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
exports.AdminUsuariosController = void 0;
const common_1 = require("@nestjs/common");
const admin_usuarios_service_1 = require("./admin-usuarios.service");
const create_admin_user_dto_1 = require("./dto/create-admin-user.dto");
const update_admin_user_dto_1 = require("./dto/update-admin-user.dto");
const swagger_1 = require("@nestjs/swagger");
let AdminUsuariosController = class AdminUsuariosController {
    adminUsuariosService;
    constructor(adminUsuariosService) {
        this.adminUsuariosService = adminUsuariosService;
    }
    login(body) {
        return this.adminUsuariosService.login(body.email, body.senha);
    }
    create(createAdminUserDto) {
        return this.adminUsuariosService.create(createAdminUserDto);
    }
    findAll() {
        return this.adminUsuariosService.findAll();
    }
    findOne(id) {
        return this.adminUsuariosService.findOne(id);
    }
    update(id, updateAdminUserDto) {
        return this.adminUsuariosService.update(id, updateAdminUserDto);
    }
    remove(id) {
        return this.adminUsuariosService.remove(id);
    }
};
exports.AdminUsuariosController = AdminUsuariosController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login para o painel SaaS (Super Admin/Support)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "login", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_user_dto_1.CreateAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_user_dto_1.UpdateAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminUsuariosController.prototype, "remove", null);
exports.AdminUsuariosController = AdminUsuariosController = __decorate([
    (0, swagger_1.ApiTags)('Admin Users'),
    (0, common_1.Controller)('admin/usuarios'),
    __metadata("design:paramtypes", [admin_usuarios_service_1.AdminUsuariosService])
], AdminUsuariosController);
//# sourceMappingURL=admin-usuarios.controller.js.map