import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { CreateFarmUseCase } from '../application/use-cases/create-farm.use-case';
import { DeactivateFarmUseCase } from '../application/use-cases/deactivate-farm.use-case';
import { ListFarmsUseCase } from '../application/use-cases/list-farms.use-case';
import { SelectFarmUseCase } from '../application/use-cases/select-farm.use-case';
import { UpdateFarmUseCase } from '../application/use-cases/update-farm.use-case';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmResponseDto } from './dto/farm.response';
import { SelectFarmResponseDto } from './dto/select-farm.response';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { ApiAccountResponse } from '../../presentation/account-api-response.decorator';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('account/farms')
export class FarmsController {
  constructor(
    private readonly createFarm: CreateFarmUseCase,
    private readonly listFarms: ListFarmsUseCase,
    private readonly updateFarm: UpdateFarmUseCase,
    private readonly selectFarm: SelectFarmUseCase,
    private readonly deactivateFarm: DeactivateFarmUseCase,
  ) {}

  @Get()
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({
    operationId: 'listAccountFarms',
    summary: 'Listar fazendas acessíveis',
  })
  @ApiAccountResponse({ type: FarmResponseDto, isArray: true })
  list() {
    return this.listFarms.execute();
  }

  @Post()
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'createAccountFarm', summary: 'Criar fazenda' })
  @ApiAccountResponse({
    type: FarmResponseDto,
    created: true,
    acceptsInput: true,
  })
  create(@Body() dto: CreateFarmDto) {
    return this.createFarm.execute({
      name: dto.name,
      parentId: dto.parentId ?? null,
    });
  }

  @Patch(':id')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({ operationId: 'updateAccountFarm', summary: 'Editar fazenda' })
  @ApiAccountResponse({ type: FarmResponseDto, acceptsInput: true })
  update(
    @Param('id', ParseIntPipe) farmId: number,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.updateFarm.execute({ farmId, ...dto });
  }

  @Post(':id/select')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('configuracoes:ler')
  @ApiOperation({
    operationId: 'selectAccountFarm',
    summary: 'Selecionar fazenda',
  })
  @ApiAccountResponse({ type: SelectFarmResponseDto, acceptsInput: true })
  select(@Param('id', ParseIntPipe) farmId: number) {
    return this.selectFarm.execute({ farmId });
  }

  @Delete(':id')
  @RequirePermissions('configuracoes:gerenciar')
  @ApiOperation({
    operationId: 'deactivateAccountFarm',
    summary: 'Desativar fazenda',
  })
  @ApiAccountResponse({ type: FarmResponseDto })
  deactivate(@Param('id', ParseIntPipe) farmId: number) {
    return this.deactivateFarm.execute({ farmId });
  }
}
