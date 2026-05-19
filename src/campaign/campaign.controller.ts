import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        sectionId: { type: 'string' },
        hasDiscount: { type: 'boolean' },
        discountId: { type: 'string' },
        startAt: { type: 'string' },
        endAt: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new campaign' })
  create(
    @Body() dto: CreateCampaignDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.campaignService.create(dto, files);
  }

  @Get()
  @ApiOperation({ summary: 'List all campaigns' })
  findAll() {
    return this.campaignService.findAll();
  }

  @Get('sections')
  @ApiOperation({ summary: 'List all sections for campaign creation' })
  getSections() {
    return this.campaignService.getSections();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        sectionId: { type: 'string' },
        hasDiscount: { type: 'boolean' },
        discountId: { type: 'string' },
        startAt: { type: 'string' },
        endAt: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        images: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiOperation({ summary: 'Update campaign by ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.campaignService.update(id, dto, files);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change campaign status (active/inactive)' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
  ) {
    return this.campaignService.changeStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign by ID' })
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
