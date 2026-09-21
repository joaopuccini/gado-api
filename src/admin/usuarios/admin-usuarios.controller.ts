import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsuariosService } from './admin-usuarios.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminLoginUseCase } from '../../auth/application/use-cases/admin-login.use-case';
import { ApiErrorDto } from '../../common/contracts/api-error.dto';
import { ApiMetaDto } from '../../common/contracts/api-meta.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AdminLoginDataDto, AdminLoginDto } from './dto/admin-login.dto';

class AdminLoginResponseDto {
  @ApiProperty({ type: AdminLoginDataDto })
  data!: AdminLoginDataDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}

@ApiTags('Admin Users')
@Controller('admin/usuarios')
export class AdminUsuariosController {
  constructor(
    private readonly adminUsuariosService: AdminUsuariosService,
    private readonly adminLogin: AdminLoginUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login para o painel SaaS (Super Admin/Support)' })
  @ApiOkResponse({ type: AdminLoginResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  @ApiInternalServerErrorResponse({ type: ApiErrorDto })
  login(@Body() body: AdminLoginDto) {
    return this.adminLogin.execute(body);
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
  update(
    @Param('id') id: string,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ) {
    return this.adminUsuariosService.update(id, updateAdminUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUsuariosService.remove(id);
  }
}
