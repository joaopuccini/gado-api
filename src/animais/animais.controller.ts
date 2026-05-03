import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnimaisService } from './animais.service';
import { CreateAnimalDto, UpdateAnimalDto } from './dto/animal.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Animais')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('animais')
export class AnimaisController {
    constructor(private readonly service: AnimaisService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar animal' })
    async create(@Body() dto: CreateAnimalDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar animais (com paginação e relações)' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar animal por ID (detalhes completos)' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar animal' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnimalDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir animal' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
