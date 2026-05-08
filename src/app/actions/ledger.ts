"use server";

import { prisma } from "@/lib/prisma";

export async function getCustomerLedger(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) throw new Error("Customer not found");

  const [sales, payments] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
      include: { items: { include: { product: true } } }
    }),
    prisma.payment.findMany({
      where: { customerId, status: 'COMPLETED' },
      orderBy: { date: 'asc' }
    })
  ]);

  // Combine and sort by date
  const ledger = [
    ...sales.map(s => ({
      id: s.id,
      date: s.date,
      type: 'SALE',
      description: `Sale (Items: ${s.items.reduce((acc, i) => acc + i.cartonsSold, 0)} Cartons)`,
      debit: s.totalAmount, // Increases customer debt
      credit: 0
    })),
    ...payments.map(p => ({
      id: p.id,
      date: p.date,
      type: 'PAYMENT',
      description: `Payment Received (${p.method.replace('_', ' ')})`,
      debit: 0,
      credit: p.amount // Decreases customer debt
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  const ledgerWithBalance = ledger.map(entry => {
    runningBalance = runningBalance + entry.debit - entry.credit;
    return { ...entry, runningBalance };
  });

  return { customer, ledger: ledgerWithBalance };
}
