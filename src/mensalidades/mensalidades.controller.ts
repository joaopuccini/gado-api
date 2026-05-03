import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MensalidadesService } from './mensalidades.service';

@Controller('plano_mensalidades')
export class MensalidadesController {
    constructor(private readonly mensalidadesService: MensalidadesService) { }

    @Get('buscar')
    async findAll() {
        const data = await this.mensalidadesService.findAll();
        return { sucesso: true, data };
    }

    @Get('buscarum/:id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const data = await this.mensalidadesService.findOne(id);
        return { sucesso: true, data };
    }

    @Post('cadastrar')
    async create(@Body() data: any) {
        const response = await this.mensalidadesService.create(data);
        return { message: 'Sucesso ao cadastrar!', response };
    }

    @Patch('editar/:id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        const dataResponse = await this.mensalidadesService.update(id, data);
        return { sucesso: true, data: dataResponse };
    }

    @Delete('deletar/:id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        const data = await this.mensalidadesService.remove(id);
        return { sucesso: true, data };
    }
}
