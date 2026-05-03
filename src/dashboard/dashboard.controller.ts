import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly service: DashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Estatísticas básicas' })
    async getStats() {
        return this.service.getStats();
    }

    @Get('total_machos_femeas')
    @ApiOperation({ summary: 'Total de machos e fêmeas ativos' })
    async getTotalMachoFemea() {
        return this.service.getTotalMachoFemea();
    }

    @Get('total')
    @ApiOperation({ summary: 'Total de custo acumulado' })
    async getTotalCusto() {
        const data = await this.service.getTotalCustoAnimaisComCusto();
        return { sucesso: true, data };
    }

    @Get('total_lprc_ativos')
    @ApiOperation({ summary: 'Total de lotes, pastos, raças e clientes ativos' })
    async getTotalLPRC(@Query() query: any) {
        const data = await this.service.getTotalLotesPastosRacasClientesAtivos(query);
        return { sucesso: true, data };
    }

    @Get('total_tipo_custo')
    @ApiOperation({ summary: 'Total por tipo de custo' })
    async getTotalTipoCusto() {
        return this.service.getTotalPorTipoCusto();
    }

    @Get('total_12_meses')
    @ApiOperation({ summary: 'Total de custo nos últimos 12 meses' })
    async getTotal12Meses() {
        const data = await this.service.getTotalCusto12Meses();
        return { sucesso: true, data };
    }
}
