import { getIssuersEnvelope } from "@/lib/compare";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getIssuersEnvelope());
}
