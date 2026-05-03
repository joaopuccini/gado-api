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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAnimalDto = exports.CreateAnimalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAnimalDto {
    id_usuario_nome;
    id_lote;
    id_raca;
    id_cliente;
    id_pasto;
    matriz;
    nome;
    status;
    sexo;
    nascimento;
    numero_brinco;
    data_entrada;
    preco_kilo;
    peso;
    tipo_compra;
    total;
    valor_custo_final;
    castrado;
    observacao;
}
exports.CreateAnimalDto = CreateAnimalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nomes dos usuários responsáveis', example: ['João', 'Maria'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAnimalDto.prototype, "id_usuario_nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do Lote', example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "id_lote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da Raça', example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "id_raca", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do Cliente (se comprado de terceiros)', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "id_cliente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do Pasto atual', example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "id_pasto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Indica se é uma matriz (vaca de cria)', example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAnimalDto.prototype, "matriz", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome ou identificação visual', example: 'Mmimosa 12' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status vital/comercial', example: 'ATIVO', enum: ['ATIVO', 'VENDIDO', 'MORTO'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sexo do animal', example: 'M', enum: ['M', 'F'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "sexo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data de nascimento', example: '2023-01-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "nascimento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Número do brinco de identificação', example: 101 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "numero_brinco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data de entrada na fazenda', example: '2024-04-17' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "data_entrada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Preço por Kg na compra', example: 12.50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "preco_kilo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Peso inicial (Kg)', example: 250.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "peso", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo de compra', example: 'OLHO', enum: ['OLHO', 'KILO', 'NASCIMENTO'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "tipo_compra", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor total da compra', example: 3000.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Total de custos acumulados', example: 150.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAnimalDto.prototype, "valor_custo_final", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Indica se o animal é castrado', example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAnimalDto.prototype, "castrado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Observações gerais', example: 'Animal dócil' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnimalDto.prototype, "observacao", void 0);
class UpdateAnimalDto {
    id_usuario_nome;
    id_lote;
    id_raca;
    id_cliente;
    id_pasto;
    matriz;
    nome;
    status;
    sexo;
    nascimento;
    numero_brinco;
    data_entrada;
    preco_kilo;
    peso;
    tipo_compra;
    total;
    valor_custo_final;
    castrado;
    observacao;
}
exports.UpdateAnimalDto = UpdateAnimalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateAnimalDto.prototype, "id_usuario_nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "id_lote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "id_raca", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "id_cliente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "id_pasto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAnimalDto.prototype, "matriz", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "sexo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "nascimento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "numero_brinco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "data_entrada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "preco_kilo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "peso", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "tipo_compra", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAnimalDto.prototype, "valor_custo_final", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAnimalDto.prototype, "castrado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnimalDto.prototype, "observacao", void 0);
//# sourceMappingURL=animal.dto.js.map