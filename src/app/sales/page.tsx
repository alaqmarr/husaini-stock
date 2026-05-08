import { getSales } from "@/app/actions/sales";
import { getCustomers } from "@/app/actions/customers";
import { getProducts } from "@/app/actions/products";
import SalesClient from "./SalesClient";

export default async function SalesPage() {
  const [sales, customers, products] = await Promise.all([
    getSales(),
    getCustomers(),
    getProducts()
  ]);
  
  return <SalesClient sales={sales} customers={customers} products={products} />;
}
