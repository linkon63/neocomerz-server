import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
  CreateProductDto,
  CreateProductMediaDto,
  CreateVariantDto,
  CreateVariantMediaDto,
  ProductQueryDto,
  UpdateProductDto,
  UpdateProductMediaDto,
  UpdateVariantMediaDto,
  UpdateVariantDto,
} from './dto/product.dto';

const productInclude = {
  brand: true,
  category: true,
  unit: true,
  baseUnit: true,
  supplier: true,
  branch: true,
  vat: true,
  channels: { include: { channel: true } },
  tags: true,
  media: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
  variants: {
    include: {
      attributes: { include: { attributeValue: { include: { attribute: true } } } },
      media: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
    },
  },
};

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateProductDto) {
    const {
      tagIds,
      channelIds,
      baseUnitId,
      supplierId,
      branchId,
      vatId,
      ...productData
    } = dto;
    await this.ensureBrandCategoryAndUnit(
      dto.brandId,
      dto.categoryId,
      dto.unitId,
      baseUnitId,
    );
    await this.ensureRelations({ supplierId, branchId, vatId, channelIds });
    return this.prisma.product.create({
      data: {
        ...productData,
        baseUnitId,
        supplierId,
        branchId,
        vatId,
        tags: tagIds?.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
        channels: channelIds?.length
          ? { create: channelIds.map((channelId) => ({ channelId })) }
          : undefined,
      },
      include: productInclude,
    });
  }

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.brandId) where.brandId = query.brandId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;

    if (query.minPrice || query.maxPrice) {
      const min = query.minPrice ? parseFloat(query.minPrice) : undefined;
      const max = query.maxPrice ? parseFloat(query.maxPrice) : undefined;
      where.variants = {
        some: {
          price: {
            gte: min,
            lte: max,
          },
        },
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sort === 'name-asc' || query.sort === 'alphabetical') {
      orderBy = { name: 'asc' };
    } else if (query.sort === 'name-desc') {
      orderBy = { name: 'desc' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    let enriched = await this.enrichWithDiscounts(data);

    if (query.sort === 'price-asc') {
      enriched.sort((a: any, b: any) => {
        const priceA = a.variants?.[0] ? parseFloat(a.variants[0].price.toString()) : 0;
        const priceB = b.variants?.[0] ? parseFloat(b.variants[0].price.toString()) : 0;
        return priceA - priceB;
      });
    } else if (query.sort === 'price-desc') {
      enriched.sort((a: any, b: any) => {
        const priceA = a.variants?.[0] ? parseFloat(a.variants[0].price.toString()) : 0;
        const priceB = b.variants?.[0] ? parseFloat(b.variants[0].price.toString()) : 0;
        return priceB - priceA;
      });
    }

    return { data: enriched, meta: { page, limit, total } };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return this.enrichWithDiscounts(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: productInclude,
    });
    if (!product) throw new NotFoundException(`Product with slug ${slug} not found`);
    return this.enrichWithDiscounts(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const {
      tagIds,
      channelIds,
      baseUnitId,
      supplierId,
      branchId,
      vatId,
      ...productData
    } = dto;
    if (dto.brandId || dto.categoryId || dto.unitId || baseUnitId) {
      const current = await this.prisma.product.findUniqueOrThrow({ where: { id } });
      await this.ensureBrandCategoryAndUnit(
        dto.brandId ?? current.brandId,
        dto.categoryId ?? current.categoryId,
        dto.unitId ?? (current as any).unitId,
        baseUnitId ?? (current as any).baseUnitId,
      );
    }
    await this.ensureRelations({ supplierId, branchId, vatId, channelIds });
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        baseUnitId,
        supplierId,
        branchId,
        vatId,
        tags: tagIds ? { set: tagIds.map((tagId) => ({ id: tagId })) } : undefined,
        channels: channelIds
          ? {
              deleteMany: {},
              create: channelIds.map((channelId) => ({ channelId })),
            }
          : undefined,
      },
      include: productInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
    return { message: 'Product deleted successfully' };
  }

  async addMedia(productId: string, dto: CreateProductMediaDto, file: Express.Multer.File) {
    await this.findOne(productId);
    if (!file) throw new BadRequestException('Media file is required');

    const url = await this.uploadService.uploadFile(file, 'products');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isFeatured) {
        await tx.productMedia.updateMany({
          where: { productId },
          data: { isFeatured: false },
        });
      }

      const media = await tx.media.create({
        data: {
          url,
          type: dto.type ?? 'image',
          provider: process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local',
        },
      });

      return tx.productMedia.create({
        data: {
          productId,
          mediaId: media.id,
          isFeatured: dto.isFeatured ?? false,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { media: true },
      });
    });
  }

  async addVariantMedia(variantId: string, dto: CreateVariantMediaDto, file: Express.Multer.File) {
    await this.findVariant(variantId);
    if (!file) throw new BadRequestException('Media file is required');

    const url = await this.uploadService.uploadFile(file, 'variants');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isFeatured) {
        await tx.variantMedia.updateMany({
          where: { variantId },
          data: { isFeatured: false },
        });
      }

      const media = await tx.media.create({
        data: {
          url,
          type: dto.type ?? 'image',
          provider: process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local',
        },
      });

      return tx.variantMedia.create({
        data: {
          variantId,
          mediaId: media.id,
          isFeatured: dto.isFeatured ?? false,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { media: true },
      });
    });
  }

  listVariantMedia(variantId: string) {
    return this.prisma.variantMedia.findMany({
      where: { variantId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateVariantMedia(id: string, dto: UpdateVariantMediaDto) {
    const existing = await this.prisma.variantMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Variant media with ID ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isFeatured) {
        await tx.variantMedia.updateMany({
          where: { variantId: existing.variantId },
          data: { isFeatured: false },
        });
      }
      return tx.variantMedia.update({
        where: { id },
        data: dto,
        include: { media: true },
      });
    });
  }

  async removeVariantMedia(id: string) {
    const existing = await this.prisma.variantMedia.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) throw new NotFoundException(`Variant media with ID ${id} not found`);

    await this.prisma.variantMedia.delete({ where: { id } });
    await this.prisma.media.delete({ where: { id: existing.mediaId } });
    await this.uploadService.deleteFile(existing.media.url);
    return { message: 'Variant media deleted successfully' };
  }

  listMedia(productId: string) {
    return this.prisma.productMedia.findMany({
      where: { productId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateMedia(id: string, dto: UpdateProductMediaDto) {
    const existing = await this.prisma.productMedia.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product media with ID ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isFeatured) {
        await tx.productMedia.updateMany({
          where: { productId: existing.productId },
          data: { isFeatured: false },
        });
      }
      return tx.productMedia.update({
        where: { id },
        data: dto,
        include: { media: true },
      });
    });
  }

  async removeMedia(id: string) {
    const existing = await this.prisma.productMedia.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) throw new NotFoundException(`Product media with ID ${id} not found`);

    await this.prisma.productMedia.delete({ where: { id } });
    await this.prisma.media.delete({ where: { id: existing.mediaId } });
    await this.uploadService.deleteFile(existing.media.url);
    return { message: 'Product media deleted successfully' };
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    await this.findOne(productId);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { isDefault: false },
        });
      }

      return tx.productVariant.create({
        data: {
          sku: dto.sku,
          price: dto.price,
          cost: dto.cost,
          stockQuantity: dto.stockQuantity ?? 0,
          stockAlertThreshold: dto.stockAlertThreshold ?? 10,
          isDefault: dto.isDefault ?? false,
          productId,
          attributes: dto.attributeValueIds?.length
            ? {
                create: dto.attributeValueIds.map((attributeValueId) => ({
                  attributeValueId,
                })),
              }
            : undefined,
        },
        include: { attributes: { include: { attributeValue: true } } },
      });
    });
  }

  listVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      include: { attributes: { include: { attributeValue: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findVariant(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
        attributes: { include: { attributeValue: true } },
        media: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
      },
    });
    if (!variant) throw new NotFoundException(`Variant with ID ${id} not found`);
    return variant;
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const existing = await this.findVariant(id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.productVariant.updateMany({
          where: { productId: existing.productId },
          data: { isDefault: false },
        });
      }
      if (dto.attributeValueIds) {
        await tx.productVariantAttribute.deleteMany({ where: { variantId: id } });
      }
      return tx.productVariant.update({
        where: { id },
        data: {
          sku: dto.sku,
          price: dto.price,
          cost: dto.cost,
          stockQuantity: dto.stockQuantity,
          stockAlertThreshold: dto.stockAlertThreshold,
          isDefault: dto.isDefault,
          attributes: dto.attributeValueIds
            ? {
                create: dto.attributeValueIds.map((attributeValueId) => ({
                  attributeValueId,
                })),
              }
            : undefined,
        },
        include: { attributes: { include: { attributeValue: true } } },
      });
    });
  }

  async removeVariant(id: string) {
    await this.findVariant(id);
    await this.prisma.productVariant.delete({ where: { id } });
    return { message: 'Variant deleted successfully' };
  }

  private async enrichWithDiscounts(products: any | any[]) {
    const list = Array.isArray(products) ? products : [products];
    const productIds = list.map((p: any) => p.id).filter(Boolean);
    if (!productIds.length) return products;

    const now = new Date();
    const discountProducts = await this.prisma.discountProduct.findMany({
      where: {
        productId: { in: productIds },
        discount: {
          status: 'active',
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
      },
      include: { discount: true },
    });

    const discountMap = new Map<string, any[]>();
    for (const dp of discountProducts) {
      const arr = discountMap.get(dp.productId) || [];
      arr.push(dp.discount);
      discountMap.set(dp.productId, arr);
    }

    for (const product of list) {
      const discounts = discountMap.get(product.id);
      if (!discounts?.length) continue;

      const bestDiscount = this.pickBestDiscount(discounts, product.variants);
      if (!bestDiscount) continue;

      product.discount = {
        id: bestDiscount.id,
        type: bestDiscount.type,
        value: Number(bestDiscount.value),
      };

      if (product.variants) {
        for (const variant of product.variants) {
          const price = Number(variant.price);
          const { discountAmount, discountedPrice } = this.calculateDiscount(
            price,
            bestDiscount.type as 'percentage' | 'fixed',
            Number(bestDiscount.value),
          );
          variant.discountAmount = discountAmount;
          variant.discountedPrice = discountedPrice;
        }
      }
    }

    return Array.isArray(products) ? list : list[0];
  }

  private pickBestDiscount(discounts: any[], variants: any[]) {
    if (discounts.length === 1) return discounts[0];
    const lowestPrice = variants?.length
      ? Math.min(...variants.map((v: any) => Number(v.price)))
      : 0;
    return discounts.reduce((best: any, current: any) => {
      const currentAmount = current.type === 'percentage'
        ? lowestPrice * (Number(current.value) / 100)
        : Number(current.value);
      const bestAmount = best.type === 'percentage'
        ? lowestPrice * (Number(best.value) / 100)
        : Number(best.value);
      return currentAmount > bestAmount ? current : best;
    });
  }

  private calculateDiscount(price: number, type: 'percentage' | 'fixed', value: number) {
    const discountAmount = type === 'percentage'
      ? price * (value / 100)
      : value;
    const actualDiscount = Math.min(discountAmount, price);
    return {
      discountAmount: Math.round(actualDiscount * 100) / 100,
      discountedPrice: Math.round((price - actualDiscount) * 100) / 100,
    };
  }

  private async ensureBrandCategoryAndUnit(
    brandId: string,
    categoryId: string,
    unitId?: string,
    baseUnitId?: string,
  ) {
    const [brand, category, unit, baseUnit] = await Promise.all([
      this.prisma.brand.findUnique({ where: { id: brandId } }),
      this.prisma.category.findUnique({ where: { id: categoryId } }),
      unitId ? (this.prisma as any).unit.findUnique({ where: { id: unitId } }) : null,
      baseUnitId ? (this.prisma as any).unit.findUnique({ where: { id: baseUnitId } }) : null,
    ]);
    if (!brand) throw new BadRequestException(`Brand with ID ${brandId} not found`);
    if (!category) throw new BadRequestException(`Category with ID ${categoryId} not found`);
    if (unitId && !unit) throw new BadRequestException(`Unit with ID ${unitId} not found`);
    if (baseUnitId && !baseUnit) {
      throw new BadRequestException(`Base unit with ID ${baseUnitId} not found`);
    }
  }

  private async ensureRelations(params: {
    supplierId?: string;
    branchId?: string;
    vatId?: string;
    channelIds?: string[];
  }) {
    const { supplierId, branchId, vatId, channelIds } = params;
    const [supplier, branch, vat, channels] = await Promise.all([
      supplierId ? this.prisma.supplier.findUnique({ where: { id: supplierId } }) : null,
      branchId ? this.prisma.branch.findUnique({ where: { id: branchId } }) : null,
      vatId ? this.prisma.vatRate.findUnique({ where: { id: vatId } }) : null,
      channelIds?.length
        ? this.prisma.channel.findMany({ where: { id: { in: channelIds } } })
        : [],
    ]);
    if (supplierId && !supplier) {
      throw new BadRequestException(`Supplier with ID ${supplierId} not found`);
    }
    if (branchId && !branch) {
      throw new BadRequestException(`Branch with ID ${branchId} not found`);
    }
    if (vatId && !vat) {
      throw new BadRequestException(`VAT with ID ${vatId} not found`);
    }
    if (channelIds?.length && channels.length !== channelIds.length) {
      throw new BadRequestException('One or more channels not found');
    }
  }
}
