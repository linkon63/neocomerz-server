import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsUUID()
  variantId: string;

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
