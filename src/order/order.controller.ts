import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderService } from './order.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from current user cart' })
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.orderService.create(req.user.id, dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(@Request() req) {
    return this.orderService.myOrders(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.orderService.cancel(id, req.user.id);
  }
}
