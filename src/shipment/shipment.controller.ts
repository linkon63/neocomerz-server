import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipment.dto';
import { ShipmentService } from './shipment.service';

@ApiTags('Shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipment (admin only)' })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentService.create(dto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get shipments by order ID (admin only)' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.shipmentService.findByOrder(orderId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipment (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentService.update(id, dto);
  }

  @Patch(':id/shipped')
  @ApiOperation({ summary: 'Mark shipment as shipped (admin only)' })
  markShipped(@Param('id') id: string) {
    return this.shipmentService.markShipped(id);
  }

  @Patch(':id/delivered')
  @ApiOperation({ summary: 'Mark shipment as delivered (admin only)' })
  markDelivered(@Param('id') id: string) {
    return this.shipmentService.markDelivered(id);
  }
}
