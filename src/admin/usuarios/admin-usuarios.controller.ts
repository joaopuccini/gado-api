import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminUsuariosService } from './admin-usuarios.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Users')
@Controller('admin/usuarios')
export class AdminUsuariosController {
  constructor(private readonly adminUsuariosService: AdminUsuariosService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login para o painel SaaS (Super Admin/Support)' })
  login(@Body() body: any) {
    return this.adminUsuariosService.login(body.email, body.senha);
  }

  @Post()
  create(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.adminUsuariosService.create(createAdminUserDto);
  }

  @Get()
  findAll() {
    return this.adminUsuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsuariosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminUserDto: UpdateAdminUserDto) {
    return this.adminUsuariosService.update(id, updateAdminUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUsuariosService.remove(id);
  }
}
