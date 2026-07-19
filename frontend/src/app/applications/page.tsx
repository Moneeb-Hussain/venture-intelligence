import { getApplicationsIndex } from "@/lib/api";
import { ApplicationsIndexScreen } from "@/components/screens/applications-index";

export default async function ApplicationsPage() {
  const rows = await getApplicationsIndex();
  return <ApplicationsIndexScreen rows={rows} />;
}
