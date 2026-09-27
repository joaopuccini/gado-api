import {
  Body,
  Controller,
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
import { ApiHerdResponse } from '../../../herd/catalog/presentation/herd-api-response.decorator';
import { ManageWeightsUseCase } from '../application/use-cases/manage-weights.use-case';
import {
  CorrectWeightDto,
  CreateWeightDto,
  WeightPageResponseDto,
  WeightPaginationDto,
  WeightResponseDto,
} from './dto/weight.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pesagens')
export class WeightController {
  constructor(private readonly weights: ManageWeightsUseCase) {}

  @Get()
  @RequirePermissions('pesagens:ler')
  @ApiOperation({ operationId: 'listWeights', summary: 'Listar pesagens' })
  @ApiHerdResponse({ type: WeightPageResponseDto })
  list(@Query() query: WeightPaginationDto) {
    return this.weights.list({
      page: query.page,
      limit: query.limit,
      ...(query.animalId === undefined ? {} : { animalId: query.animalId }),
    });
  }

  @Get(':id')
  @RequirePermissions('pesagens:ler')
  @ApiOperation({ operationId: 'getWeight', summary: 'Consultar pesagem' })
  @ApiHerdResponse({ type: WeightResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.weights.get({ id });
  }

  @Post()
  @RequirePermissions('pesagens:criar')
  @ApiOperation({ operationId: 'createWeight', summary: 'Registrar pesagem' })
  @ApiHerdResponse({
    type: WeightResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: CreateWeightDto) {
    return this.weights.register(dto);
  }

  @Patch(':id/correction')
  @RequirePermissions('pesagens:gerenciar')
  @ApiOperation({
    operationId: 'correctWeight',
    summary: 'Corrigir pesagem preservando a revisão anterior',
  })
  @ApiHerdResponse({ type: WeightResponseDto, acceptsInput: true })
  correct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectWeightDto,
  ) {
    return this.weights.correct({ id, ...dto });
  }
}
