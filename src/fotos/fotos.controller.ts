import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FotosService } from './fotos.service';
import { CreateFotoDto, UpdateFotoDto } from './dto/foto.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Fotos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('fotos')
export class FotosController {
    constructor(private readonly service: FotosService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar foto' })
    async create(@Body() dto: CreateFotoDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar fotos' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true } });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar foto' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id, { animal: true });
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar foto' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFotoDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir foto' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
