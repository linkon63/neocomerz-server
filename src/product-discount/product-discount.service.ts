import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDiscountDto, DiscountScopeDto, UpdateProductDiscountDto } from './dto/product-discount.dto';

type DiscountScope = DiscountScopeDto;

interface DiscountTargets {
  productIds?: string[];
  categoryIds?: string[];
  brandIds?: string[];
}

@Injectable()
export class ProductDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDiscountDto) {
    const { productIds, categoryIds, brandIds, ...data } = dto;
    const scope = data.scope ?? 'product';
    const targets = { productIds, categoryIds, brandIds };

    this.validateDateRange(data.startDate, data.endDate);
    await this.validateTargets(scope, targets);

    if (data.type === 'fixed') {
      const validation = await this.validateFixedDiscountValue(scope, targets, data.value);
      if (!validation.valid) return this.invalidFixedDiscountResponse(data.value, validation.invalidProducts);
    }

    return this.prisma.productDiscount.create({
      data: {
        ...data,
        scope,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        products: scope === 'product' ? this.createProductLinks(productIds) : undefined,
        categories: scope === 'category' ? this.createCategoryLinks(categoryIds) : undefined,
        brands: scope === 'brand' ? this.createBrandLinks(brandIds) : undefined,
      },
      include: this.discountInclude(),
    });
  }

  findAll() {
    return this.prisma.productDiscount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { products: true, categories: true, brands: true } },
      },
    });
  }

  async findOne(id: string) {
    const discount = await this.prisma.productDiscount.findUnique({
      where: { id },
      include: this.discountInclude(),
    });
    if (!discount) throw new NotFoundException(`Product discount with ID ${id} not found`);
    return discount;
  }

  async update(id: string, dto: UpdateProductDiscountDto) {
    const existing = await this.prisma.productDiscount.findUnique({
      where: { id },
      include: {
        products: { select: { productId: true } },
        categories: { select: { categoryId: true } },
        brands: { select: { brandId: true } },
      },
    });
    if (!existing) throw new NotFoundException(`Product discount with ID ${id} not found`);

    const { productIds, categoryIds, brandIds, ...data } = dto;
    const scope = data.scope ?? existing.scope;
    const targets = await this.resolveUpdateTargets(scope as DiscountScope, {
      productIds,
      categoryIds,
      brandIds,
    }, existing);

    this.validateDateRange(
      data.startDate,
      data.endDate,
      existing.startDate ?? undefined,
      existing.endDate ?? undefined,
    );
    await this.validateTargets(scope as DiscountScope, targets);

    const currentType = data.type ?? existing.type;
    const currentValue = data.value ?? Number(existing.value);
    if (currentType === 'fixed') {
      const validation = await this.validateFixedDiscountValue(scope as DiscountScope, targets, currentValue);
      if (!validation.valid) return this.invalidFixedDiscountResponse(currentValue, validation.invalidProducts);
    }

    return this.prisma.productDiscount.update({
      where: { id },
      data: {
        ...data,
        scope,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        products: this.updateProductLinks(scope as DiscountScope, productIds),
        categories: this.updateCategoryLinks(scope as DiscountScope, categoryIds),
        brands: this.updateBrandLinks(scope as DiscountScope, brandIds),
      },
      include: this.discountInclude(),
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.productDiscount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product discount with ID ${id} not found`);

    await this.prisma.$transaction([
      this.prisma.discountProduct.deleteMany({ where: { discountId: id } }),
      this.prisma.discountCategory.deleteMany({ where: { discountId: id } }),
      this.prisma.discountBrand.deleteMany({ where: { discountId: id } }),
      this.prisma.productDiscount.delete({ where: { id } }),
    ]);

    return { message: 'Product discount deleted successfully' };
  }

  private discountInclude() {
    return {
      products: {
        include: {
          product: {
            include: {
              variants: { orderBy: { price: 'asc' as const } },
              brand: true,
              category: true,
            },
          },
        },
      },
      categories: { include: { category: true } },
      brands: { include: { brand: true } },
    };
  }

  private validateDateRange(startDate?: string, endDate?: string | null, existingStart?: Date, existingEnd?: Date | null) {
    const start = startDate !== undefined ? new Date(startDate) : existingStart;
    const end = endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingEnd;
    if (start && end && end <= start) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private async resolveUpdateTargets(
    scope: DiscountScope,
    targets: DiscountTargets,
    existing: {
      scope: string;
      products: Array<{ productId: string }>;
      categories: Array<{ categoryId: string }>;
      brands: Array<{ brandId: string }>;
    },
  ): Promise<DiscountTargets> {
    if (scope === 'product') {
      return {
        ...targets,
        productIds: targets.productIds ?? (existing.scope === 'product' ? existing.products.map(p => p.productId) : undefined),
      };
    }
    if (scope === 'category') {
      return {
        ...targets,
        categoryIds: targets.categoryIds ?? (existing.scope === 'category' ? existing.categories.map(c => c.categoryId) : undefined),
      };
    }
    if (scope === 'brand') {
      return {
        ...targets,
        brandIds: targets.brandIds ?? (existing.scope === 'brand' ? existing.brands.map(b => b.brandId) : undefined),
      };
    }
    return targets;
  }

  private async validateTargets(scope: DiscountScope, targets: DiscountTargets) {
    if (scope === 'all') return;

    if (scope === 'product') {
      this.requireIds(targets.productIds, 'productIds is required when scope is product');
      await this.validateProductsExist(targets.productIds!);
      return;
    }

    if (scope === 'category') {
      this.requireIds(targets.categoryIds, 'categoryIds is required when scope is category');
      await this.validateCategoriesExist(targets.categoryIds!);
      return;
    }

    if (scope === 'brand') {
      this.requireIds(targets.brandIds, 'brandIds is required when scope is brand');
      await this.validateBrandsExist(targets.brandIds!);
    }
  }

  private requireIds(ids: string[] | undefined, message: string) {
    if (!ids?.length) throw new BadRequestException(message);
  }

  private createProductLinks(productIds?: string[]) {
    return productIds?.length ? { create: productIds.map((productId) => ({ productId })) } : undefined;
  }

  private createCategoryLinks(categoryIds?: string[]) {
    return categoryIds?.length ? { create: categoryIds.map((categoryId) => ({ categoryId })) } : undefined;
  }

  private createBrandLinks(brandIds?: string[]) {
    return brandIds?.length ? { create: brandIds.map((brandId) => ({ brandId })) } : undefined;
  }

  private updateProductLinks(scope: DiscountScope, productIds?: string[]) {
    if (scope !== 'product') return { deleteMany: {} };
    return productIds ? { deleteMany: {}, create: productIds.map((productId) => ({ productId })) } : undefined;
  }

  private updateCategoryLinks(scope: DiscountScope, categoryIds?: string[]) {
    if (scope !== 'category') return { deleteMany: {} };
    return categoryIds ? { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) } : undefined;
  }

  private updateBrandLinks(scope: DiscountScope, brandIds?: string[]) {
    if (scope !== 'brand') return { deleteMany: {} };
    return brandIds ? { deleteMany: {}, create: brandIds.map((brandId) => ({ brandId })) } : undefined;
  }

  private async validateProductsExist(productIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('One or more product IDs are invalid');
    }
  }

  private async validateCategoriesExist(categoryIds: string[]) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (categories.length !== new Set(categoryIds).size) {
      throw new BadRequestException('One or more category IDs are invalid');
    }
  }

  private async validateBrandsExist(brandIds: string[]) {
    const brands = await this.prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true },
    });
    if (brands.length !== new Set(brandIds).size) {
      throw new BadRequestException('One or more brand IDs are invalid');
    }
  }

  private async validateFixedDiscountValue(
    scope: DiscountScope,
    targets: DiscountTargets,
    value: number,
  ): Promise<
    | { valid: true }
    | { valid: false; invalidProducts: Array<{ productId: string; lowestPrice: number }> }
  > {
    const lowestPrices = await this.prisma.productVariant.groupBy({
      by: ['productId'],
      where: this.productVariantWhereForScope(scope, targets),
      _min: { price: true },
    });

    const invalid = lowestPrices
      .filter((v) => Number(v._min.price) < value)
      .map((v) => ({ productId: v.productId, lowestPrice: Number(v._min.price) }));

    return invalid.length > 0
      ? { valid: false, invalidProducts: invalid }
      : { valid: true };
  }

  private productVariantWhereForScope(scope: DiscountScope, targets: DiscountTargets) {
    if (scope === 'product') return { productId: { in: targets.productIds } };
    if (scope === 'category') return { product: { categoryId: { in: targets.categoryIds } } };
    if (scope === 'brand') return { product: { brandId: { in: targets.brandIds } } };
    return {};
  }

  private invalidFixedDiscountResponse(
    value: number,
    invalidProducts: Array<{ productId: string; lowestPrice: number }>,
  ) {
    return {
      success: false,
      message: `Fixed discount value (${value}) exceeds the retail price for ${invalidProducts.length} product(s)`,
      invalidProducts,
    };
  }
}
