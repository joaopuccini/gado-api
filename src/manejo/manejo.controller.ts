import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManejoService } from './manejo.service';
import { CreateManejoDto, UpdateManejoDto } from './dto/manejo.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Manejo')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('manejos')
export class ManejoController {
    constructor(private readonly service: ManejoService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar manejo' })
    async create(@Body() dto: CreateManejoDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar manejos' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, boi: true } });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar manejo' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id, { animal: true, boi: true });
        return data;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar manejo' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateManejoDto) {
        const data = await this.service.update(id, dto);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir manejo' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return data;
    }
}
