import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssinaturasService } from './assinaturas.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';

@Controller('admin/assinaturas')
export class AssinaturasController {
  constructor(private readonly assinaturasService: AssinaturasService) {}

  @Post()
  create(@Body() createAssinaturaDto: CreateAssinaturaDto) {
    return this.assinaturasService.create(createAssinaturaDto);
  }

  @Get()
  findAll() {
    return this.assinaturasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assinaturasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssinaturaDto: UpdateAssinaturaDto) {
    return this.assinaturasService.update(id, updateAssinaturaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assinaturasService.remove(id);
  }

  @Post('pagamentos/:pagamentoId/baixar')
  registrarBaixa(@Param('pagamentoId') pagamentoId: string, @Body('valorPago') valorPago: number) {
    return this.assinaturasService.registrarPagamento(pagamentoId, valorPago);
  }
}
