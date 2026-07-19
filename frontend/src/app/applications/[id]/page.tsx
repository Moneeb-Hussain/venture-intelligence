import { getApplicationSnapshots } from "@/lib/api";
import { ApplicationScreen } from "@/components/screens/application-screen";

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const snapshots = await getApplicationSnapshots(params.id);
  return <ApplicationScreen snapshots={snapshots} />;
}
