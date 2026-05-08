"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPayments() {
  return await prisma.payment.findMany({
    orderBy: { date: 'desc' },
    include: {
      customer: true
    }
  });
}

export async function getPendingPayments() {
  return await prisma.payment.findMany({
    where: { status: 'PENDING' },
    orderBy: { date: 'desc' },
    include: {
      customer: true
    }
  });
}

export async function createPayment(data: { customerId: string, amount: number, method: string, status: string }) {
  try {
    const payment = await prisma.payment.create({
      data: {
        customerId: data.customerId,
        amount: data.amount,
        method: data.method,
        status: data.status,
      }
    });

    // Only reduce balance if payment is completed
    if (data.status === 'COMPLETED') {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: { balance: { decrement: data.amount } }
      });
    }

    revalidatePath('/payments');
    revalidatePath('/customers');
    return { success: true, payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markPaymentCompleted(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'COMPLETED') throw new Error('Payment already completed');

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' }
    });

    // Reduce balance now that it's completed
    await prisma.customer.update({
      where: { id: payment.customerId },
      data: { balance: { decrement: payment.amount } }
    });

    revalidatePath('/payments');
    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
