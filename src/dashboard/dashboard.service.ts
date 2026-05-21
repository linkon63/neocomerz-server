import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      sales,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'pending' } }),
      this.prisma.order.count({ where: { status: 'processing' } }),
      this.prisma.order.count({ where: { status: 'delivered' } }),
      this.prisma.user.count(),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.productVariant.count({ where: { stockQuantity: { lte: 10 } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { placedAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      totalSales: Number(sales._sum.total ?? 0),
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
    };
  }

  sales() {
    return this.prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      orderBy: { placedAt: 'desc' },
      select: { id: true, orderNumber: true, total: true, placedAt: true },
    });
  }

  orders() {
    return this.prisma.order.groupBy({ by: ['status'], _count: { id: true } });
  }

  products() {
    return this.prisma.product.findMany({
      take: 10,
      where: { deletedAt: null },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  customers() {
    return this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  }
}
