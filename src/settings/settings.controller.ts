import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create settings' })
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get first settings' })
  findFirst() {
    return this.settingsService.findFirst();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settings by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update settings by ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Patch()
  @ApiOperation({ summary: 'Update first settings (create if not exists)' })
  updateFirst(@Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.updateFirst(updateSettingDto);
  }
}
