"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSales() {
  return await prisma.sale.findMany({
    orderBy: { date: 'desc' },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });
}

export async function createSale(data: { 
  customerId: string, 
  items: Array<{ productId: string, cartonsSold: number, overrideRatePerScrew?: number }> 
}) {
  try {
    let totalAmount = 0;
    const saleItems = [];

    // Calculate prices and deduct stock
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product not found.`);
      if (product.currentCartons < item.cartonsSold) throw new Error(`Not enough stock for ${product.name}`);

      // Get or Update custom price for customer
      let rate = 0;
      
      if (item.overrideRatePerScrew !== undefined && item.overrideRatePerScrew > 0) {
        // User provided a new rate during sale, use it and update their profile
        rate = item.overrideRatePerScrew;
        await prisma.customerPrice.upsert({
          where: { customerId_productId: { customerId: data.customerId, productId: item.productId } },
          update: { ratePerScrew: rate },
          create: { customerId: data.customerId, productId: item.productId, ratePerScrew: rate }
        });
      } else {
        // Fetch existing rate
        const customPrice = await prisma.customerPrice.findUnique({
          where: { customerId_productId: { customerId: data.customerId, productId: item.productId } }
        });

        if (!customPrice) {
           throw new Error(`No custom rate set for ${product.name} for this customer. Please enter a rate below or set it in Customers tab.`);
        } else {
           rate = customPrice.ratePerScrew;
        }
      }

      const totalScrews = item.cartonsSold * product.boxesPerCarton * product.screwsPerBox;
      const itemTotal = totalScrews * rate;
      totalAmount += itemTotal;

      saleItems.push({
        productId: item.productId,
        cartonsSold: item.cartonsSold,
        boxesSold: 0,
        ratePerScrew: rate,
        totalPrice: itemTotal
      });

      // Deduct stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentCartons: { decrement: item.cartonsSold } }
      });
      
      // Record stock txn
      await prisma.stockTransaction.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          cartons: item.cartonsSold,
          notes: `Sold to customer`
        }
      });
    }

    // Create Sale record
    const sale = await prisma.sale.create({
      data: {
        customerId: data.customerId,
        totalAmount,
        paymentStatus: 'PENDING',
        items: {
          create: saleItems
        }
      }
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { balance: { increment: totalAmount } }
    });

    revalidatePath('/sales');
    revalidatePath('/customers');
    revalidatePath('/products');
    
    return { success: true, sale };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
