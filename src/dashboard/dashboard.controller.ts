import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary (admin only)' })
  summary() {
    return this.dashboardService.summary();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report data (admin only)' })
  sales() {
    return this.dashboardService.sales();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get order status report data (admin only)' })
  orders() {
    return this.dashboardService.orders();
  }

  @Get('products')
  @ApiOperation({ summary: 'Get product report data (admin only)' })
  products() {
    return this.dashboardService.products();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer report data (admin only)' })
  customers() {
    return this.dashboardService.customers();
  }
}
