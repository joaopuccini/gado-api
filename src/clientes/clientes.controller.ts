import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('clientes')
export class ClientesController {
    constructor(private readonly service: ClientesService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar cliente' })
    async create(@Body() dto: CreateClienteDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar clientes' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar cliente' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return data;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar cliente' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
        const data = await this.service.update(id, dto);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir cliente' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return data;
    }
}
