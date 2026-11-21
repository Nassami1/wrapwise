import { normalizeQuery } from "@/lib/curated";
import { readSnapshots } from "@/lib/snapshots";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = normalizeQuery(req.nextUrl.searchParams.get("symbol") || "NVDA") || "NVDA";
  return Response.json({
    data: readSnapshots(symbol),
    source: "cache",
    fetchedAt: new Date().toISOString(),
  });
}
