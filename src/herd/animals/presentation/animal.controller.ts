import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { ApiHerdResponse } from '../../catalog/presentation/herd-api-response.decorator';
import { ManageAnimalsUseCase } from '../application/use-cases/manage-animals.use-case';
import {
  AnimalPageResponseDto,
  AnimalPaginationDto,
  AnimalResponseDto,
  CreateAnimalDto,
  UpdateAnimalDto,
} from './dto/animal.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('animais')
export class AnimalsController {
  constructor(private readonly animals: ManageAnimalsUseCase) {}

  @Get()
  @RequirePermissions('animais:ler')
  @ApiOperation({
    operationId: 'listAnimals',
    summary: 'Listar animais da fazenda',
  })
  @ApiHerdResponse({ type: AnimalPageResponseDto })
  list(@Query() query: AnimalPaginationDto) {
    return this.animals.list({ page: query.page, limit: query.limit });
  }

  @Get(':id')
  @RequirePermissions('animais:ler')
  @ApiOperation({
    operationId: 'getAnimal',
    summary: 'Consultar animal da fazenda',
  })
  @ApiHerdResponse({ type: AnimalResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.animals.get({ id });
  }

  @Post()
  @RequirePermissions('animais:criar')
  @ApiOperation({
    operationId: 'createAnimal',
    summary: 'Cadastrar ou comprar animal',
  })
  @ApiHerdResponse({
    type: AnimalResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: CreateAnimalDto) {
    return this.animals.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('animais:editar')
  @ApiOperation({
    operationId: 'updateAnimal',
    summary: 'Editar animal da fazenda',
  })
  @ApiHerdResponse({ type: AnimalResponseDto, acceptsInput: true })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnimalDto) {
    return this.animals.update({ id, ...dto });
  }

  @Delete(':id')
  @RequirePermissions('animais:excluir')
  @ApiOperation({
    operationId: 'deactivateAnimal',
    summary: 'Dar baixa no animal',
  })
  @ApiHerdResponse({ type: AnimalResponseDto })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.animals.deactivate({ id });
  }
}
