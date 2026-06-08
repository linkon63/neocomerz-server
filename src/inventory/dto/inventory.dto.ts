import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustInventoryDto {
  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ example: 'product-uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 10, description: 'Positive for restock, negative for reduction' })
  @Type(() => Number)
  @IsInt()
  change: number;

  @ApiProperty({ enum: ['sale', 'restock', 'return', 'correction', 'manual'] })
  @IsIn(['sale', 'restock', 'return', 'correction', 'manual'])
  reason: 'sale' | 'restock' | 'return' | 'correction' | 'manual';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
