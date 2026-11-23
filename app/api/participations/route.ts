import { database } from "../../../lib/database";
import { hash, isFamily } from "../../../lib/security";
import {
  CUSTOM_GIFT_PREFIX,
  diapers,
  gifts,
  isValidGift,
} from "../../../data/items";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL)
    return Response.json(
      { error: "O chá está sendo preparado. Tente novamente em breve." },
      { status: 503 },
    );
  const family = new URL(request.url).searchParams.has("family");
  if (family && !isFamily(request))
    return Response.json({ error: "Senha inválida." }, { status: 401 });
  try {
    const sql = database();
    const rows = family
      ? await sql`SELECT id, name, contact, relationship, message, true AS "publicMessage", diaper, gift, seat, avatar FROM participations ORDER BY created_at DESC`
      : await sql`SELECT id, name, message, true AS "publicMessage", seat, avatar FROM participations ORDER BY seat NULLS LAST`;
    return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Não foi possível carregar as presenças." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, token, name, contact, relationship, message, diaper, gift } =
      body;
    if (
      typeof id !== "string" ||
      !/^[0-9a-f-]{36}$/.test(id) ||
      typeof token !== "string" ||
      !/^[0-9a-f]{64}$/.test(token) ||
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.length > 80 ||
      typeof contact !== "string" ||
      contact.length > 150 ||
      typeof relationship !== "string" ||
      relationship.trim().length < 2 ||
      relationship.length > 80 ||
      typeof message !== "string" ||
      message.length > 1000 ||
      !diapers.some((item) => item.id === diaper) ||
      !isValidGift(gift)
    ) {
      return Response.json(
        { error: "Confira os campos preenchidos." },
        { status: 400 },
      );
    }
    const storedGift = gift?.startsWith(CUSTOM_GIFT_PREFIX)
      ? CUSTOM_GIFT_PREFIX + gift.slice(CUSTOM_GIFT_PREFIX.length).trim()
      : gift || null;
    const sql = database();
    // Serializa as reservas para conferir limites sem disputa entre visitantes.
    const result = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(513280)`;
      const existing =
        await tx`SELECT id FROM participations WHERE id = ${id} AND token_hash = ${hash(token)}`;
      if (existing.length) return true; // Repetir envio após falha de rede não duplica.
      for (const [column, item] of [
        ["diaper", diapers.find((i) => i.id === diaper)],
        ["gift", gifts.find((i) => i.id === gift)],
      ] as const) {
        if (!item) continue;
        const counts =
          column === "diaper"
            ? await tx`SELECT count(*)::int AS count FROM participations WHERE diaper = ${item.id}`
            : await tx`SELECT count(*)::int AS count FROM participations WHERE gift = ${item.id}`;
        if (counts[0].count >= item.quantity) return false;
      }
      await tx`INSERT INTO participations (id, token_hash, name, contact, relationship, message, public_message, diaper, gift) VALUES (${id}, ${hash(token)}, ${name.trim()}, ${contact.trim()}, ${relationship.trim()}, ${message.trim()}, ${true}, ${diaper}, ${storedGift})`;
      return true;
    });
    return result
      ? Response.json({ id }, { status: 201 })
      : Response.json(
          { error: "Um dos presentes acabou de ser reservado. Escolha outro." },
          { status: 409 },
        );
  } catch {
    return Response.json(
      {
        error:
          "Não conseguimos salvar. Tente novamente; sua escolha não será duplicada.",
      },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isFamily(request)) return Response.json({ error: "Senha inválida." }, { status: 401 });
  try {
    const { id } = await request.json();
    if (typeof id !== "string") return Response.json({ error: "Participação inválida." }, { status: 400 });
    const sql = database();
    await sql`DELETE FROM participations WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível apagar a participação." }, { status: 503 });
  }
}
