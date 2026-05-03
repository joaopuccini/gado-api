import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PlanosService } from './planos.service';

@Controller('planos')
export class PlanosController {
    constructor(private readonly planosService: PlanosService) { }

    @Get('buscar')
    async findAll() {
        const data = await this.planosService.findAll();
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.planosService.findOne(id);
        return { sucesso: true, data };
    }

    @Post('cadastrar')
    async create(@Body() data: any) {
        const response = await this.planosService.create(data);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Patch('editar/:id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        const dataResponse = await this.planosService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }

    @Delete('deletar/:id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.planosService.remove(id);
        return { sucesso: true, data };
    }
}
