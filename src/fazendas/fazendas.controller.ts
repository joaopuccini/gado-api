import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { FazendasService } from './fazendas.service';

@Controller('fazendas')
export class FazendasController {
    constructor(private readonly fazendasService: FazendasService) { }

    @Get('buscar')
    async findAll() {
        const data = await this.fazendasService.findAll();
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.fazendasService.findOne(id);
        return { sucesso: true, data };
    }

    @Get('buscar_fazendas_usuario')
    async findByUserId(@Query('usuarioId', ParseIntPipe) usuarioId: number) {
        const data = await this.fazendasService.findByUserId(usuarioId);
        return { sucesso: true, data };
    }

    @Post('cadastrar')
    async create(@Body() data: any) {
        const response = await this.fazendasService.create(data);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Patch('editar/:id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        const dataResponse = await this.fazendasService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }

    @Delete('deletar/:id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.fazendasService.remove(id);
        return { sucesso: true, data };
    }
}
