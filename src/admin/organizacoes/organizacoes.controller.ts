import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrganizacoesService } from './organizacoes.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { AdminGuard } from '../guards/admin.guard';

@Controller('admin/organizacoes')
// @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Implement AdminGuard
export class OrganizacoesController {
  constructor(private readonly organizacoesService: OrganizacoesService) {}

  @Post()
  create(@Body() createOrganizacaoDto: CreateOrganizacaoDto) {
    return this.organizacoesService.create(createOrganizacaoDto);
  }

  @Get()
  findAll() {
    return this.organizacoesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizacoesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganizacaoDto: UpdateOrganizacaoDto) {
    return this.organizacoesService.update(id, updateOrganizacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizacoesService.remove(id);
  }
}
