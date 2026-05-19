import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { CampaignService } from './campaign.service';

@ApiTags('Public Campaigns')
@Controller('campaigns/public')
@Public()
export class PublicCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'Get active campaigns for public display' })
  @ApiQuery({ name: 'section', required: false, description: 'Filter by section title (e.g., "Hero Banner")' })
  async getActiveCampaigns(@Query('section') section?: string) {
    const campaigns = await this.campaignService.findAll();
    
    // Filter active campaigns
    const activeCampaigns = campaigns.filter(campaign => {
      const now = new Date();
      const isActive = campaign.status === 'active';
      const hasStarted = !campaign.startAt || new Date(campaign.startAt) <= now;
      const hasNotEnded = !campaign.endAt || new Date(campaign.endAt) > now;
      
      return isActive && hasStarted && hasNotEnded;
    });

    // Filter by section if provided
    if (section) {
      return activeCampaigns.filter(campaign => 
        campaign.section?.title?.toLowerCase().includes(section.toLowerCase())
      );
    }

    return activeCampaigns;
  }

  @Get('hero')
  @ApiOperation({ summary: 'Get active hero banner campaigns' })
  async getHeroCampaigns() {
    return this.getActiveCampaigns('Hero Banner');
  }
}