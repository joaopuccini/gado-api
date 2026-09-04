import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PastosService } from './pastos.service';
import { CreatePastoDto, UpdatePastoDto } from './dto/pasto.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Pastos')
// @ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
@Controller('pastos')
export class PastosController {
    constructor(private readonly service: PastosService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar pasto' })
    async create(@Body() dto: CreatePastoDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar pastos' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar pasto' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return data;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar pasto' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePastoDto) {
        const data = await this.service.update(id, dto);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir pasto' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return data;
    }
}
