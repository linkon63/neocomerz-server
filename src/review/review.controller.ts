import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('products/:productId/reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create product review' })
  create(@Request() req, @Param('productId') productId: string, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(req.user.id, productId, dto);
  }

  @Get('products/:productId/reviews')
  @Public()
  @ApiOperation({ summary: 'Get approved product reviews' })
  productReviews(@Param('productId') productId: string) {
    return this.reviewService.productReviews(productId);
  }

  @Get('reviews/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get pending reviews (admin only)' })
  pending() {
    return this.reviewService.pending();
  }

  @Get('reviews/approved')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get approved reviews (admin only)' })
  approved() {
    return this.reviewService.approved();
  }

  @Patch('reviews/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update review (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewService.update(id, dto);
  }

  @Patch('reviews/:id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve review (admin only)' })
  approve(@Param('id') id: string) {
    return this.reviewService.approve(id);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete review (admin only)' })
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
