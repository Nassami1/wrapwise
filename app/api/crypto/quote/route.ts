import { getCryptoQuote } from "@/lib/compare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  return Response.json(await getCryptoQuote(id));
}
