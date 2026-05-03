import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KilosService } from './kilos.service';
import { CreateKiloDto, UpdateKiloDto } from './dto/kilo.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Pesagem (Kilos)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('kilos')
export class KilosController {
    constructor(private readonly service: KilosService) { }

    @Post('cadastrar')
    @ApiOperation({ summary: 'Cadastrar pesagem' })
    async create(@Body() dto: CreateKiloDto) {
        const response = await this.service.create(dto);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Get('buscar')
    @ApiOperation({ summary: 'Listar pesagens' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true } });
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    @ApiOperation({ summary: 'Buscar pesagem' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id, { animal: true });
        return { sucesso: true, data };
    }

    @Patch('editar/:id')
    @ApiOperation({ summary: 'Editar pesagem' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKiloDto) {
        const data = await this.service.update(id, dto);
        return { sucesso: true, data };
    }

    @Delete('deletar/:id')
    @ApiOperation({ summary: 'Excluir pesagem' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return { sucesso: true, data };
    }
}
