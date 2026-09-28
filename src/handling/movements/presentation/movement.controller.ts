import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { ApiHerdResponse } from '../../../herd/catalog/presentation/herd-api-response.decorator';
import { MoveAnimalUseCase } from '../application/use-cases/move-animal.use-case';
import {
  BatchMovementDto,
  MovementHistoryQueryDto,
  MovementResponseDto,
  PastureMovementDto,
} from './dto/movement.dto';

@ApiTags('Gado App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('animal-movements')
export class MovementController {
  constructor(private readonly movements: MoveAnimalUseCase) {}

  @Post('pasture')
  @RequirePermissions('movimentacoes:criar')
  @ApiOperation({
    operationId: 'moveAnimalToPasture',
    summary: 'Mover animal para outro pasto',
  })
  @ApiHerdResponse({
    type: MovementResponseDto,
    created: true,
    acceptsInput: true,
  })
  toPasture(@Body() dto: PastureMovementDto) {
    return this.movements.toPasture(dto);
  }

  @Post('batch')
  @RequirePermissions('movimentacoes:criar')
  @ApiOperation({
    operationId: 'moveAnimalToBatch',
    summary: 'Mover animal para outro lote',
  })
  @ApiHerdResponse({
    type: MovementResponseDto,
    created: true,
    acceptsInput: true,
  })
  toBatch(@Body() dto: BatchMovementDto) {
    return this.movements.toBatch(dto);
  }

  @Get('history')
  @RequirePermissions('movimentacoes:ler')
  @ApiOperation({
    operationId: 'listAnimalMovementHistory',
    summary: 'Listar histórico paginado de movimentações',
  })
  @ApiHerdResponse({ type: MovementResponseDto, paginated: true })
  history(@Query() query: MovementHistoryQueryDto) {
    return this.movements.history({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.animalId === undefined ? {} : { animalId: query.animalId }),
      ...(query.kind === undefined ? {} : { kind: query.kind }),
    });
  }
}
