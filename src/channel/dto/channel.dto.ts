import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ example: 'Web' })
  @IsString()
  name: string;
}

export class UpdateChannelDto extends PartialType(CreateChannelDto) {}
