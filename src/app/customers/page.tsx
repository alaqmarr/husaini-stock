import { getCustomers } from "@/app/actions/customers";
import { getProducts } from "@/app/actions/products";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const [customers, products] = await Promise.all([
    getCustomers(),
    getProducts()
  ]);
  
  return <CustomersClient customers={customers} products={products} />;
}
