import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CaixaService } from './caixa.service';
import { CreateCaixaDto, UpdateCaixaDto } from './dto/caixa.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Caixa')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('caixa')
export class CaixaController {
    constructor(private readonly service: CaixaService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar lançamento em caixa' })
    async create(@Body() dto: CreateCaixaDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar lançamentos' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar lançamento' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return data;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar lançamento' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCaixaDto) {
        const data = await this.service.update(id, dto);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir lançamento' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return data;
    }
}
