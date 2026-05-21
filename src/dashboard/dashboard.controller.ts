import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  summary() {
    return this.dashboardService.summary();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report data' })
  sales() {
    return this.dashboardService.sales();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get order status report data' })
  orders() {
    return this.dashboardService.orders();
  }

  @Get('products')
  @ApiOperation({ summary: 'Get product report data' })
  products() {
    return this.dashboardService.products();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer report data' })
  customers() {
    return this.dashboardService.customers();
  }
}
