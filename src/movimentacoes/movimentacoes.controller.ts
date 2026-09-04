import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MovimentoPastoService, MovimentoLoteService } from './movimentacoes.service';
import { CreateMovPastoDto, CreateMovLoteDto } from './dto/movimentacao.dto';
import { PaginationDto } from '../common/dto';

@ApiTags('Movimentações Pasto')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('movimento_animal_pasto')
export class MovimentoPastoController {
    constructor(private readonly service: MovimentoPastoService) { }

    @Post()
    @ApiOperation({ summary: 'Mover animal de pasto' })
    async create(@Body() dto: CreateMovPastoDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar movimentos de pasto' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, pastoOrigem: true, pastoDestino: true } });
        return data;
    }
}

@ApiTags('Movimentações Lote')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('movimento_lote')
export class MovimentoLoteController {
    constructor(private readonly service: MovimentoLoteService) { }

    @Post()
    @ApiOperation({ summary: 'Mover animal de lote' })
    async create(@Body() dto: CreateMovLoteDto) {
        const response = await this.service.create(dto);
        return response;
    }

    @Get()
    @ApiOperation({ summary: 'Listar movimentos de lote' })
    async findAll(@Query() p: PaginationDto) {
        const data = await this.service.findAll({ skip: p.skip, take: p.limit, include: { animal: true, loteOrigem: true, loteDestino: true } });
        return data;
    }
}
