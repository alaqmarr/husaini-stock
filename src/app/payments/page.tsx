import { getPayments, getPendingPayments } from "@/app/actions/payments";
import { getCustomers } from "@/app/actions/customers";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const [payments, pendingPayments, customers] = await Promise.all([
    getPayments(),
    getPendingPayments(),
    getCustomers()
  ]);
  
  return <PaymentsClient payments={payments} pendingPayments={pendingPayments} customers={customers} />;
}
