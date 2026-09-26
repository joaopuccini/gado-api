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
import { ManageHerdCatalogUseCase } from '../application/use-cases/manage-herd-catalog.use-case';
import {
  BatchResponseDto,
  BatchPageResponseDto,
  BreedResponseDto,
  BreedPageResponseDto,
  CatalogDescriptionDto,
  CatalogPaginationDto,
} from './dto/herd-catalog.dto';
import { ApiHerdResponse } from './herd-api-response.decorator';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('racas')
export class BreedsController {
  constructor(private readonly catalog: ManageHerdCatalogUseCase) {}

  @Get()
  @RequirePermissions('racas:ler')
  @ApiOperation({ operationId: 'listBreeds', summary: 'Listar raças ativas' })
  @ApiHerdResponse({ type: BreedPageResponseDto })
  list(@Query() query: CatalogPaginationDto) {
    return this.catalog.listBreeds({ page: query.page, limit: query.limit });
  }

  @Get(':id')
  @RequirePermissions('racas:ler')
  @ApiOperation({ operationId: 'getBreed', summary: 'Consultar raça' })
  @ApiHerdResponse({ type: BreedResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getBreed({ id });
  }

  @Post()
  @RequirePermissions('racas:gerenciar')
  @ApiOperation({ operationId: 'createBreed', summary: 'Cadastrar raça' })
  @ApiHerdResponse({
    type: BreedResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: CatalogDescriptionDto) {
    return this.catalog.createBreed(dto);
  }

  @Patch(':id')
  @RequirePermissions('racas:gerenciar')
  @ApiOperation({ operationId: 'updateBreed', summary: 'Editar raça' })
  @ApiHerdResponse({ type: BreedResponseDto, acceptsInput: true })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CatalogDescriptionDto,
  ) {
    return this.catalog.updateBreed({ id, ...dto });
  }

  @Delete(':id')
  @RequirePermissions('racas:gerenciar')
  @ApiOperation({ operationId: 'deactivateBreed', summary: 'Desativar raça' })
  @ApiHerdResponse({ type: BreedResponseDto })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deactivateBreed({ id });
  }
}

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('lotes')
export class BatchesController {
  constructor(private readonly catalog: ManageHerdCatalogUseCase) {}

  @Get()
  @RequirePermissions('lotes:ler')
  @ApiOperation({
    operationId: 'listBatches',
    summary: 'Listar lotes ativos da fazenda',
  })
  @ApiHerdResponse({ type: BatchPageResponseDto })
  list(@Query() query: CatalogPaginationDto) {
    return this.catalog.listBatches({ page: query.page, limit: query.limit });
  }

  @Get(':id')
  @RequirePermissions('lotes:ler')
  @ApiOperation({
    operationId: 'getBatch',
    summary: 'Consultar lote da fazenda',
  })
  @ApiHerdResponse({ type: BatchResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getBatch({ id });
  }

  @Post()
  @RequirePermissions('lotes:gerenciar')
  @ApiOperation({
    operationId: 'createBatch',
    summary: 'Cadastrar lote na fazenda',
  })
  @ApiHerdResponse({
    type: BatchResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: CatalogDescriptionDto) {
    return this.catalog.createBatch(dto);
  }

  @Patch(':id')
  @RequirePermissions('lotes:gerenciar')
  @ApiOperation({
    operationId: 'updateBatch',
    summary: 'Editar lote da fazenda',
  })
  @ApiHerdResponse({ type: BatchResponseDto, acceptsInput: true })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CatalogDescriptionDto,
  ) {
    return this.catalog.updateBatch({ id, ...dto });
  }

  @Delete(':id')
  @RequirePermissions('lotes:gerenciar')
  @ApiOperation({
    operationId: 'deactivateBatch',
    summary: 'Desativar lote da fazenda',
  })
  @ApiHerdResponse({ type: BatchResponseDto })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.deactivateBatch({ id });
  }
}
