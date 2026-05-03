import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LotesService } from './lotes.service';
import { CreateLoteDto, UpdateLoteDto } from './dto/lote.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Lotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('lotes')
export class LotesController {
    constructor(private readonly service: LotesService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar lote' })
    async create(@Body() dto: CreateLoteDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar todos os lotes' })
    async findAll(@Query() pagination: PaginationDto) {
        const data = await this.service.findAll({ skip: pagination.skip, take: pagination.limit });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar lote por ID' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar lote' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLoteDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir lote (soft-delete)' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
