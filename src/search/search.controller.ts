import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ProductQueryDto } from '../product/dto/product.dto';
import { ProductService } from '../product/product.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Search products' })
  products(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Get product name suggestions' })
  async suggestions(@Query('q') q?: string) {
    const result = await this.productService.findAll({ search: q, page: 1, limit: 10 });
    return result.data.map((product) => ({ id: product.id, name: product.name, slug: product.slug }));
  }
}
