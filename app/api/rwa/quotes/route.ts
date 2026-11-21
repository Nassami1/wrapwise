import { getComparison } from "@/lib/compare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || req.nextUrl.searchParams.get("asset") || "NVDA";
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  return Response.json(await getComparison(symbol, refresh));
}
