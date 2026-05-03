import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, Delete, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VendasService } from './vendas.service';
import { CreateVendaDto } from './dto/venda.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Vendas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vendas')
export class VendasController {
    constructor(private readonly service: VendasService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Registrar venda' })
    async create(@Body() dto: CreateVendaDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar vendas' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { cliente: true } });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Detalhes da venda' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id, { cliente: true, vendaAnimais: { include: { animal: true } } });
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir venda' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
