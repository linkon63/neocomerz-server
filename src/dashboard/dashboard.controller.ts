import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService, type DateRange } from './dashboard.service';

function parseRange(from?: string, to?: string): DateRange | undefined {
  if (!from || !to) return undefined;
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(f.getTime()) || isNaN(t.getTime())) return undefined;
  return { from: f, to: t };
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary (admin only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboardService.summary(parseRange(from, to));
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report data (admin only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboardService.sales(parseRange(from, to));
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
