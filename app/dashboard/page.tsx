import { WrapApp } from "@/components/WrapApp";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { asset?: string; amount?: string };
}) {
  return <WrapApp initialAsset={searchParams.asset || "GOLD"} initialAmount={searchParams.amount || "1000"} />;
}
