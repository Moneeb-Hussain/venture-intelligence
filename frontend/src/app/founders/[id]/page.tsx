import { getFounder } from "@/lib/api";
import { FounderScreen } from "@/components/screens/founder-screen";

export default async function FounderPage({
  params,
}: {
  params: { id: string };
}) {
  const founder = await getFounder(params.id);
  return <FounderScreen founder={founder} founderId={params.id} />;
}
