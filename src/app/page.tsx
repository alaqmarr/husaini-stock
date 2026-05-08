import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";

// Revalidate data periodically if desired, or let actions revalidate
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  return <DashboardClient stats={stats} />;
}
