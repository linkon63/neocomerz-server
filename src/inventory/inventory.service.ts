import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sort?: string) {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { product: { createdAt: 'desc' } },
    });

    if (sort === 'lowStock') {
      variants.sort((a, b) => {
        const la = a.stockQuantity <= a.stockAlertThreshold ? 0 : 1;
        const lb = b.stockQuantity <= b.stockAlertThreshold ? 0 : 1;
        if (la !== lb) return la - lb;
        return a.stockQuantity - b.stockQuantity;
      });
    }

    return variants;
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
