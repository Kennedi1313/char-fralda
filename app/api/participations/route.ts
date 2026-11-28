import { sessionOwner } from "../../../lib/garden-session";
import { randomBytes } from "node:crypto";
import { database } from "../../../lib/database";
import { hash, isFamily } from "../../../lib/security";
import { CUSTOM_GIFT_PREFIX } from "../../../data/items";
import { validSelection, type CatalogItem } from "../../../lib/catalog";
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
      ? await sql`SELECT id, name, contact, relationship, message, true AS "publicMessage", diaper, gift, sponsor_id AS "sponsorId", seat, avatar FROM participations ORDER BY created_at DESC`
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
    const { id, name, contact, relationship, message, diaper, gift } = body;
    const session = await sessionOwner();
    if (body.account && (!session || id !== session.owner_id))
      return Response.json(
        { error: "Entre novamente com o Google." },
        { status: 401 },
      );
    const owner = body.account ? session!.owner_id : null;
    const token = owner ? randomBytes(32).toString("hex") : body.token;
    const sponsor = body.sponsor;
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
      (sponsor == null
        ? typeof diaper !== "string" || !diaper
        : typeof sponsor !== "string" ||
          !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(sponsor) ||
          diaper !== "" ||
          gift !== "") ||
      (gift != null && typeof gift !== "string")
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
        await tx`SELECT id FROM participations WHERE (id = ${id} AND token_hash = ${hash(token)}) OR google_owner = ${owner}`;
      if (existing.length) return existing[0].id === id ? true : "linked"; // Repetir envio após falha de rede não duplica.
      const [sponsorId, proof] = sponsor?.split(".") ?? [];
      if (sponsorId) {
        const [owner] =
          await tx`SELECT token_hash FROM participations WHERE id::text = ${sponsorId} AND diaper IS NOT NULL`;
        if (!owner || hash("family:" + owner.token_hash) !== proof)
          return "invalid";
      }
      if (!sponsorId) {
        const items = await tx<CatalogItem[]>`SELECT * FROM gift_stock`;
        if (
          !validSelection(items, "diaper", diaper) ||
          !validSelection(items, "gift", gift)
        )
          return false;
      }
      await tx`INSERT INTO participations (id, token_hash, name, contact, relationship, message, public_message, diaper, gift, sponsor_id, google_owner, guest_edit_until) VALUES (${id}, ${hash(token)}, ${name.trim()}, ${contact.trim()}, ${relationship.trim()}, ${message.trim()}, ${true}, ${diaper || null}, ${storedGift}, ${sponsorId ?? null}, ${owner}, CASE WHEN ${!!owner} THEN NULL ELSE now() + interval '2 hours' END)`;
      return true;
    });
    if (result === "linked")
      return Response.json(
        {
          error:
            "Esta conta já possui uma participação. Entre novamente para retomá-la.",
        },
        { status: 409 },
      );
    if (result === "invalid")
      return Response.json(
        { error: "Este convite familiar é inválido." },
        { status: 400 },
      );
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
  if (!isFamily(request))
    return Response.json({ error: "Senha inválida." }, { status: 401 });
  try {
    const { id } = await request.json();
    if (typeof id !== "string")
      return Response.json(
        { error: "Participação inválida." },
        { status: 400 },
      );
    const sql = database();
    await sql`DELETE FROM participations WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Não foi possível apagar a participação." },
      { status: 503 },
    );
  }
}
