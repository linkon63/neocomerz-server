import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CouponService } from './coupon.service';
import { ApplyCouponDto, CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create coupon (admin only)' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply coupon to a subtotal' })
  apply(@Body() dto: ApplyCouponDto) {
    return this.couponService.apply(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List coupons (admin only)' })
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get coupon by code' })
  findByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update coupon (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete coupon (admin only)' })
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
