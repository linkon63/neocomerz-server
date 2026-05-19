import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'address-uuid' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ example: 'cash_on_delivery', enum: ['cash_on_delivery', 'bank_transfer', 'card'] })
  @IsOptional()
  @IsIn(['cash_on_delivery', 'bank_transfer', 'card'])
  paymentMethod?: 'cash_on_delivery' | 'bank_transfer' | 'card';

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
