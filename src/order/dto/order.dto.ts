import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Min } from 'class-validator';

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;

const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const;

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ description: 'Search by order number or customer name/phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'address-uuid' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ example: 'coupon-code' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] })
  @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
