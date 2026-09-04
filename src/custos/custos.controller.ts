import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, Delete, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustosService, CustoTiposService } from './custos.service';
import { CreateCustoDto, CreateCustoTipoDto } from './dto/custo.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Custos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('custos')
export class CustosController {
    constructor(private readonly custoService: CustosService) { }

    @Post()
    @ApiOperation({ summary: 'Lançar custo (distribuído entre animais)' })
    async createCusto(@Body() dto: CreateCustoDto) {
        const response = await this.custoService.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar custos' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.custoService.findAll({ skip: p.skip, take: p.limit, include: { custoTipo: true } });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar um custo' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.custoService.findOne(id);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir custo' })
    async removeCusto(@Param('id', ParseIntPipe) id: number) {
        const data = await this.custoService.remove(id);
        return data;
    }
}

@ApiTags('Custos Tipo')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('custos_tipo')
export class CustosTipoController {
    constructor(private readonly tipoService: CustoTiposService) { }

    @Post()
    @ApiOperation({ summary: 'Criar tipo de custo' })
    async createTipo(@Body() dto: CreateCustoTipoDto) {
        const response = await this.tipoService.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar tipos de custo' })
    async findTipos(@Query() p: PaginationDto) {
        const data = await this.tipoService.findAll({ skip: p.skip, take: p.limit });
        return data;
    }
}
