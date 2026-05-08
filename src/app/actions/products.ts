"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createProduct(data: { name: string, boxesPerCarton: number, screwsPerBox: number }) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        boxesPerCarton: data.boxesPerCarton,
        screwsPerBox: data.screwsPerBox,
        currentCartons: 0,
        currentBoxes: 0,
      }
    });
    revalidatePath('/products');
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProductStock(id: string, cartonsToAdd: number, notes?: string) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        currentCartons: { increment: cartonsToAdd }
      }
    });
    
    await prisma.stockTransaction.create({
      data: {
        productId: id,
        type: 'IN',
        cartons: cartonsToAdd,
        notes: notes || 'Stock Added'
      }
    });
    
    revalidatePath('/products');
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
