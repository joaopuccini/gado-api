import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VacinacaoService } from './vacinacao.service';
import { CreateVacinacaoDto, UpdateVacinacaoDto } from './dto/vacinacao.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Vacinação')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vacinacao')
export class VacinacaoController {
    constructor(private readonly service: VacinacaoService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar vacinação' })
    async create(@Body() dto: CreateVacinacaoDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar vacinações' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true } });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar vacinação' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id, { animal: true });
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar vacinação' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVacinacaoDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir vacinação' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
