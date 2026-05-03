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
var PastosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PastosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const services_1 = require("../common/services");
let PastosService = PastosService_1 = class PastosService extends services_1.BaseTenantService {
    logger = new common_1.Logger(PastosService_1.name);
    modelName = 'Pasto';
    constructor(prisma) { super(prisma); }
    getDelegate() { return this.prisma.pasto; }
};
exports.PastosService = PastosService;
exports.PastosService = PastosService = PastosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PastosService);
//# sourceMappingURL=pastos.service.js.map