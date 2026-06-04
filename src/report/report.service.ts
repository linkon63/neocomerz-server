import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : now;
    return { start, end };
  }

  async getSalesReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'paid',
        placedAt: { gte: start, lte: end },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            variant: { select: { id: true, sku: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { placedAt: 'desc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productBreakdown: Record<string, any> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.product.id;
        if (!productBreakdown[key]) {
          productBreakdown[key] = {
            productId: item.product.id,
            productName: item.product.name,
            sku: item.variant.sku,
            quantity: 0,
            revenue: 0,
          };
        }
        productBreakdown[key].quantity += item.quantity;
        productBreakdown[key].revenue += Number(item.totalPrice);
      }
    }

    return {
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        period: { start, end },
      },
      productBreakdown: Object.values(productBreakdown),
      orders: orders.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: o.user.name,
        total: Number(o.total),
        discount: Number(o.discount),
        placedAt: o.placedAt,
        items: o.items.map((i) => ({
          product: i.product.name,
          sku: i.variant.sku,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      })),
    };
  }

  async getUserReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);
    const now = new Date();

    const weekStart = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const [users, totalCustomers, newCustomersThisWeek] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null,
          role: { name: 'user' },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          role: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { name: 'user' },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: weekStart },
          deletedAt: null,
          role: { name: 'user' },
        },
      }),
    ]);

    return {
      summary: {
        totalNewUsers: users.length,
        totalCustomers,
        newCustomersThisWeek,
        period: { start, end },
      },
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role?.name ?? 'N/A',
        registeredAt: u.createdAt,
      })),
    };
  }

  async getInventoryReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const logs = await this.prisma.inventoryLog.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const allVariants = await this.prisma.productVariant.findMany({
      include: {
        product: { select: { id: true, name: true } },
      },
    });
    const lowStockVariants = allVariants.filter((v) => v.stockQuantity <= v.stockAlertThreshold);

    const totalStockIn = logs.filter((l) => l.change > 0).reduce((s, l) => s + l.change, 0);
    const totalStockOut = logs.filter((l) => l.change < 0).reduce((s, l) => s + Math.abs(l.change), 0);

    return {
      summary: {
        totalStockIn,
        totalStockOut,
        totalTransactions: logs.length,
        lowStockAlerts: lowStockVariants.length,
        period: { start, end },
      },
      stockChanges: logs.map((l) => ({
        id: l.id,
        product: l.variant.product.name,
        sku: l.variant.sku,
        change: l.change,
        reason: l.reason,
        note: l.note,
        currentStock: l.variant.stockQuantity,
        date: l.createdAt,
      })),
      lowStockAlerts: lowStockVariants.map((v) => ({
        product: v.product.name,
        sku: v.sku,
        currentStock: v.stockQuantity,
        alertThreshold: v.stockAlertThreshold,
      })),
    };
  }

  async getPurchaseReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const restockLogs = await this.prisma.inventoryLog.findMany({
      where: {
        reason: 'restock',
        createdAt: { gte: start, lte: end },
      },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPurchases = restockLogs.length;
    const totalUnits = restockLogs.reduce((s, l) => s + l.change, 0);
    const totalCost = restockLogs.reduce((s, l) => s + (l.change * Number(l.variant.cost ?? 0)), 0);

    return {
      summary: {
        totalPurchases,
        totalUnits,
        totalCost: Math.round(totalCost * 100) / 100,
        period: { start, end },
      },
      purchases: restockLogs.map((l) => ({
        id: l.id,
        product: l.variant.product.name,
        sku: l.variant.sku,
        quantity: l.change,
        unitCost: Number(l.variant.cost ?? 0),
        totalCost: Math.round(l.change * Number(l.variant.cost ?? 0) * 100) / 100,
        note: l.note,
        date: l.createdAt,
      })),
    };
  }

  async getDiscountReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const coupons = await this.prisma.coupon.findMany({
      orderBy: { usedCount: 'desc' },
    });

    const ordersWithDiscount = await this.prisma.order.findMany({
      where: {
        discount: { gt: 0 },
        placedAt: { gte: start, lte: end },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { placedAt: 'desc' },
    });

    const totalDiscountGiven = ordersWithDiscount.reduce((s, o) => s + Number(o.discount), 0);
    const couponBreakdown = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      usedCount: c.usedCount,
      maxUsage: c.maxUsage,
      expiresAt: c.expiresAt,
    }));

    return {
      summary: {
        totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
        ordersWithDiscount: ordersWithDiscount.length,
        totalCoupons: coupons.length,
        period: { start, end },
      },
      couponBreakdown: couponBreakdown,
      discountedOrders: ordersWithDiscount.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: o.user.name,
        discountAmount: Number(o.discount),
        orderTotal: Number(o.total),
        placedAt: o.placedAt,
      })),
    };
  }
}
