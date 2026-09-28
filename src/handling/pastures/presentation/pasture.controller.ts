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
import { ApiHerdResponse } from '../../../herd/catalog/presentation/herd-api-response.decorator';
import { ManagePasturesUseCase } from '../application/use-cases/manage-pastures.use-case';
import {
  PastureInputDto,
  PasturePageResponseDto,
  PasturePaginationDto,
  PastureResponseDto,
} from './dto/pasture.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pastures')
export class PastureController {
  constructor(private readonly pastures: ManagePasturesUseCase) {}

  @Get()
  @RequirePermissions('pastos:ler')
  @ApiOperation({
    operationId: 'listPastures',
    summary: 'Listar pastos ativos da fazenda',
  })
  @ApiHerdResponse({ type: PasturePageResponseDto })
  list(@Query() query: PasturePaginationDto) {
    return this.pastures.list(query);
  }

  @Get(':id')
  @RequirePermissions('pastos:ler')
  @ApiOperation({
    operationId: 'getPasture',
    summary: 'Consultar pasto da fazenda',
  })
  @ApiHerdResponse({ type: PastureResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.pastures.get({ id });
  }

  @Post()
  @RequirePermissions('pastos:gerenciar')
  @ApiOperation({ operationId: 'createPasture', summary: 'Cadastrar pasto' })
  @ApiHerdResponse({
    type: PastureResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: PastureInputDto) {
    return this.pastures.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('pastos:gerenciar')
  @ApiOperation({ operationId: 'updatePasture', summary: 'Editar pasto' })
  @ApiHerdResponse({ type: PastureResponseDto, acceptsInput: true })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: PastureInputDto) {
    return this.pastures.update({ id, ...dto });
  }

  @Delete(':id')
  @RequirePermissions('pastos:gerenciar')
  @ApiOperation({
    operationId: 'deactivatePasture',
    summary: 'Desativar pasto',
  })
  @ApiHerdResponse({ type: PastureResponseDto })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.pastures.deactivate({ id });
  }
}
