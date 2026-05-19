import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateVatDto, UpdateVatDto } from './dto/vat.dto';
import { VatService } from './vat.service';

@ApiTags('VAT')
@Controller('vat')
export class VatController {
  constructor(private readonly vatService: VatService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create VAT rate (admin only)' })
  create(@Body() dto: CreateVatDto) {
    return this.vatService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List VAT rates' })
  findAll() {
    return this.vatService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get VAT by ID' })
  findOne(@Param('id') id: string) {
    return this.vatService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update VAT by ID (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateVatDto) {
    return this.vatService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete VAT by ID (admin only)' })
  remove(@Param('id') id: string) {
    return this.vatService.remove(id);
  }
}
