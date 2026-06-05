import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sort?: string) {
    const products = await this.prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });

    const rows: Array<{
      id: string | null;
      sku: string | null;
      price: string | null;
      cost: string | null;
      stockQuantity: number;
      stockAlertThreshold: number;
      isDefault: boolean;
      product: { id: string; name: string; slug: string; status: string };
    }> = [];

    for (const product of products) {
      if (product.variants.length === 0) {
        rows.push({
          id: null,
          sku: null,
          price: null,
          cost: null,
          stockQuantity: 0,
          stockAlertThreshold: 10,
          isDefault: false,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            status: product.status,
          },
        });
      } else {
        for (const variant of product.variants) {
          rows.push({
            id: variant.id,
            sku: variant.sku,
            price: variant.price.toString(),
            cost: variant.cost?.toString() ?? null,
            stockQuantity: variant.stockQuantity,
            stockAlertThreshold: variant.stockAlertThreshold,
            isDefault: variant.isDefault,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              status: product.status,
            },
          });
        }
      }
    }

    if (sort === 'lowStock') {
      rows.sort((a, b) => {
        const la = a.stockQuantity <= a.stockAlertThreshold ? 0 : 1;
        const lb = b.stockQuantity <= b.stockAlertThreshold ? 0 : 1;
        if (la !== lb) return la - lb;
        return a.stockQuantity - b.stockQuantity;
      });
    }

    return rows;
  }

  findByVariant(variantId: string) {
    return this.prisma.inventoryLog.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  logs() {
    return this.prisma.inventoryLog.findMany({
      include: { variant: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjust(dto: AdjustInventoryDto) {
    if (!dto.variantId && !dto.productId) {
      throw new BadRequestException('Provide either variantId or productId');
    }

    let variantId = dto.variantId;

    if (!variantId && dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
        include: { variants: { orderBy: { isDefault: 'desc' }, take: 1 } },
      });
      if (!product) throw new NotFoundException(`Product with ID ${dto.productId} not found`);

      if (product.variants.length > 0) {
        variantId = product.variants[0].id;
      } else {
        const created = await this.prisma.productVariant.create({
          data: {
            sku: `AUTO-${Date.now()}`,
            price: 0,
            stockQuantity: 0,
            isDefault: true,
            productId: dto.productId,
          },
        });
        variantId = created.id;
      }
    }

    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId! } });
    if (!variant) throw new NotFoundException(`Variant with ID ${variantId} not found`);
    if (variant.stockQuantity + dto.change < 0) throw new BadRequestException('Stock cannot go negative');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id: variantId! },
        data: { stockQuantity: { increment: dto.change } },
      });
      const { productId: _, ...logData } = dto;
      const log = await tx.inventoryLog.create({ data: { ...logData, variantId: variantId! } });
      return { variant: updated, log };
    });
  }
}
