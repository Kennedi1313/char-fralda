import { database } from "../../../lib/database";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sql = database();
    const rows = await sql`SELECT id,reserved AS count FROM gift_stock WHERE reserved>0`;
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.id] = row.count;
    return Response.json(counts, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Lista indisponível no momento." },
      { status: 503 },
    );
  }
}
