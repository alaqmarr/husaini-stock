"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [totalSales, pendingPayments, lowStockProducts, recentTransactions] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: {
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } // Today
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PENDING' }
    }),
    prisma.product.findMany({
      where: { currentCartons: { lt: 10 } }, // Arbitrary low stock threshold
      take: 5
    }),
    prisma.sale.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: { customer: true }
    })
  ]);

  return {
    todaySales: totalSales._sum.totalAmount || 0,
    pendingPayments: pendingPayments._sum.amount || 0,
    lowStockProducts,
    recentTransactions
  };
}
