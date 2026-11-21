import { redirect } from "next/navigation";

export default function AssetPage({ params }: { params: { rwaId: string } }) {
  redirect(`/dashboard?asset=${encodeURIComponent(params.rwaId)}`);
}
