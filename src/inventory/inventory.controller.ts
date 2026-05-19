import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AdjustInventoryDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List variant inventory (admin only)' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get inventory logs by variant (admin only)' })
  findByVariant(@Param('variantId') variantId: string) {
    return this.inventoryService.findByVariant(variantId);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock and create inventory log (admin only)' })
  adjust(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'List inventory logs (admin only)' })
  logs() {
    return this.inventoryService.logs();
  }
}
