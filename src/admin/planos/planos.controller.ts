import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlanosService } from './planos.service';
import { CreatePlanoDto } from './dto/create-plano.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { AdminGuard } from '../guards/admin.guard'; // (to be implemented)

@Controller('admin/planos')
// @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Implement AdminGuard
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Post()
  create(@Body() createPlanoDto: CreatePlanoDto) {
    return this.planosService.create(createPlanoDto);
  }

  @Get()
  findAll() {
    return this.planosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanoDto: UpdatePlanoDto) {
    return this.planosService.update(id, updatePlanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planosService.remove(id);
  }
}
