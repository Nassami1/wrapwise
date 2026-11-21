import { getInfoEnvelope } from "@/lib/compare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "NVDA";
  return Response.json(await getInfoEnvelope(symbol));
}
