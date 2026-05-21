import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.productVariant.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
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
    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant) throw new NotFoundException(`Variant with ID ${dto.variantId} not found`);
    if (variant.stockQuantity + dto.change < 0) throw new BadRequestException('Stock cannot go negative');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id: dto.variantId },
        data: { stockQuantity: { increment: dto.change } },
      });
      const log = await tx.inventoryLog.create({ data: dto });
      return { variant: updated, log };
    });
  }
}
