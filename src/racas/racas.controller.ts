import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RacasService } from './racas.service';
import { CreateRacaDto, UpdateRacaDto } from './dto/raca.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Raças')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('racas')
export class RacasController {
    constructor(private readonly service: RacasService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar raça' })
    async create(@Body() dto: CreateRacaDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar raças' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar raça por ID' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar raça' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRacaDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir raça' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
