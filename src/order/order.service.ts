import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  address: true,
  items: { include: { product: true, variant: true } },
  payments: true,
  shipments: true,
  statusLogs: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { variant: { include: { product: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      for (const item of cart.items) {
        if (item.variant.stockQuantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for SKU ${item.variant.sku}`);
        }
        subtotal += Number(item.variant.price) * item.quantity;
      }

      let discount = 0;
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: dto.couponCode } });
        if (!coupon) throw new BadRequestException('Invalid coupon');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new BadRequestException('Coupon expired');
        }
        if (coupon.usedCount >= coupon.maxUsage) throw new BadRequestException('Coupon usage limit reached');
        discount = coupon.type === 'percentage'
          ? subtotal * (Number(coupon.value) / 100)
          : Number(coupon.value);
        discount = Math.min(discount, subtotal);
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId,
          addressId: dto.addressId,
          total: subtotal - discount,
          discount,
          shippingCost: 0,
          items: {
            create: cart.items.map((item) => ({
              productId: item.variant.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.variant.price,
              totalPrice: Number(item.variant.price) * item.quantity,
            })),
          },
          statusLogs: { create: { status: 'pending', note: 'Order created' } },
        },
        include: orderInclude,
      });

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            change: -item.quantity,
            reason: 'sale',
            referenceId: order.id,
            note: 'Order created',
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  findAll() {
    return this.prisma.order.findMany({ include: orderInclude, orderBy: { placedAt: 'desc' } });
  }

  myOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        statusLogs: { create: { status: dto.status, note: dto.note } },
      },
      include: orderInclude,
    });
  }

  async cancel(id: string, userId?: string) {
    const order = await this.findOne(id, userId);
    if (['shipped', 'delivered', 'returned'].includes(order.status)) {
      throw new BadRequestException('This order cannot be cancelled');
    }
    return this.updateStatus(id, { status: 'cancelled', note: 'Order cancelled' });
  }
}
