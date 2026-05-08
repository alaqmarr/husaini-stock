"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  return await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      prices: {
        include: {
          product: true
        }
      }
    }
  });
}

export async function createCustomer(data: { name: string, phone: string, address: string }) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
      }
    });
    revalidatePath('/customers');
    return { success: true, customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setCustomerPrice(customerId: string, productId: string, ratePerScrew: number) {
  try {
    const price = await prisma.customerPrice.upsert({
      where: {
        customerId_productId: { customerId, productId }
      },
      update: {
        ratePerScrew
      },
      create: {
        customerId,
        productId,
        ratePerScrew
      }
    });
    revalidatePath('/customers');
    return { success: true, price };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
