import { getDashboard } from "@/lib/api";
import { DashboardScreen } from "@/components/screens/dashboard";

export default async function Home() {
  const rows = await getDashboard();
  return <DashboardScreen rows={rows} />;
}
