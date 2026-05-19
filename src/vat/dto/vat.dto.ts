import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVatDto {
  @ApiProperty({ example: 'Standard VAT' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsNumber()
  rate: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVatDto extends PartialType(CreateVatDto) {}
