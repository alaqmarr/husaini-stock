"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [totalSales, pendingPayments, lowStockProducts, recentTransactions, recentSales] = await Promise.all([
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
      where: { currentCartons: { lt: 5 } }, // Changed threshold to < 5 as per user instruction
      take: 5
    }),
    prisma.sale.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: { customer: true }
    }),
    prisma.sale.findMany({
      where: {
        date: { gte: sevenDaysAgo }
      },
      select: {
        date: true,
        totalAmount: true
      }
    })
  ]);

  // Process recentSales to group by day for Recharts
  const salesByDay = recentSales.reduce((acc: any, sale) => {
    const day = sale.date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!acc[day]) acc[day] = 0;
    acc[day] += sale.totalAmount;
    return acc;
  }, {});

  // Create an array for the last 7 days to ensure all days are represented
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().split('T')[0];
    chartData.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }), // e.g. Mon, Tue
      sales: salesByDay[dayKey] || 0
    });
  }

  return {
    todaySales: totalSales._sum.totalAmount || 0,
    pendingPayments: pendingPayments._sum.amount || 0,
    lowStockProducts,
    recentTransactions,
    chartData
  };
}
