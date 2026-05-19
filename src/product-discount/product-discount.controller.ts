import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductDiscountService } from './product-discount.service';
import { CreateProductDiscountDto, UpdateProductDiscountDto } from './dto/product-discount.dto';

@ApiTags('Product Discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('product-discounts')
export class ProductDiscountController {
  constructor(private readonly productDiscountService: ProductDiscountService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product discount (admin only)' })
  create(@Body() dto: CreateProductDiscountDto) {
    return this.productDiscountService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all product discounts (admin only)' })
  findAll() {
    return this.productDiscountService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product discount by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.productDiscountService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product discount (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDiscountDto) {
    return this.productDiscountService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product discount (admin only)' })
  remove(@Param('id') id: string) {
    return this.productDiscountService.remove(id);
  }
}
