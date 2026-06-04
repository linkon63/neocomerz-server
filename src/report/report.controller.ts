import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportQueryDto, ReportFormat } from './dto/report-query.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  sales(@Query() query: ReportQueryDto) {
    return this.reportService.getSalesReport(query.startDate, query.endDate);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user registration report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  users(@Query() query: ReportQueryDto) {
    return this.reportService.getUserReport(query.startDate, query.endDate);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  inventory(@Query() query: ReportQueryDto) {
    return this.reportService.getInventoryReport(query.startDate, query.endDate);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Get purchase report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  purchases(@Query() query: ReportQueryDto) {
    return this.reportService.getPurchaseReport(query.startDate, query.endDate);
  }

  @Get('discounts')
  @ApiOperation({ summary: 'Get discount/coupon report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  discounts(@Query() query: ReportQueryDto) {
    return this.reportService.getDiscountReport(query.startDate, query.endDate);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get consolidated overview of all reports' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  overview(@Query() query: ReportQueryDto) {
    return this.reportService.getOverview(query.startDate, query.endDate);
  }
}
