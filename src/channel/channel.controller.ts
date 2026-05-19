import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { ChannelService } from './channel.service';

@ApiTags('Channels')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create channel (admin only)' })
  create(@Body() dto: CreateChannelDto) {
    return this.channelService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List channels' })
  findAll() {
    return this.channelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  findOne(@Param('id') id: string) {
    return this.channelService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update channel by ID (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete channel by ID (admin only)' })
  remove(@Param('id') id: string) {
    return this.channelService.remove(id);
  }
}
