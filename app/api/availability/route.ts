import { database } from "../../../lib/database";
import { diapers, gifts } from "../../../data/items";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sql = database();
    const rows = await sql`
      SELECT id, count(*)::int AS count
      FROM (
        SELECT diaper AS id FROM participations
        WHERE diaper IN ${sql(diapers.map((item) => item.id))}
        UNION ALL
        SELECT gift AS id FROM participations
        WHERE gift IN ${sql(gifts.map((item) => item.id))}
      ) AS reservations
      GROUP BY id
    `;
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
