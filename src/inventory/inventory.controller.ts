import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdjustInventoryDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List variant inventory' })
  @ApiQuery({ name: 'sort', required: false, enum: ['lowStock'], description: 'Sort low-stock variants first' })
  findAll(@Query('sort') sort?: string) {
    return this.inventoryService.findAll(sort);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get inventory logs by variant' })
  findByVariant(@Param('variantId') variantId: string) {
    return this.inventoryService.findByVariant(variantId);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock and create inventory log' })
  adjust(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'List inventory logs' })
  logs() {
    return this.inventoryService.logs();
  }
}
