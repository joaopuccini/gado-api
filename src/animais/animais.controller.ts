import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnimaisService } from './animais.service';
import { CreateAnimalDto, UpdateAnimalDto, TransferirAnimalDto } from './dto/animal.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Animais')
// @ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
@Controller('animais')
export class AnimaisController {
    constructor(private readonly service: AnimaisService) { }

    @Post()
    @ApiOperation({ summary: 'Cadastrar animal' })
    async create(@Body() dto: CreateAnimalDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Post('seed')
    @ApiOperation({ summary: 'Gerar animais de teste' })
    async seed() {
        return this.service.seed();
    }

    @Get()
    @ApiOperation({ summary: 'Listar animais (com paginação e relações)' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit });
        return data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar animal por ID (detalhes completos)' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.findOne(id);
        return data;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Editar animal' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnimalDto) {
        const data = await this.service.update(id, dto);
        return data;
    }

    @Post(':id/transferir')
    @ApiOperation({ summary: 'Transferir animal para outra fazenda/pasto' })
    async transferir(@Param('id', ParseIntPipe) id: number, @Body() dto: TransferirAnimalDto) {
        const data = await this.service.transferir(id, dto);
        return data;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Excluir animal' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.service.remove(id);
        return data;
    }
}
