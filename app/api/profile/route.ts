import { database } from "../../../lib/database";
import { sessionOwner } from "../../../lib/garden-session";
import { validSelection, type CatalogItem } from "../../../lib/catalog";
const unavailable = () =>
  Response.json(
    { error: "Perfil indisponível. Tente novamente." },
    { status: 503 },
  );
const login = () =>
  Response.json(
    { error: "Entre com o Google pelo convite para acessar seu perfil." },
    { status: 401 },
  );
export async function GET() {
  try {
    const session = await sessionOwner();
    if (!session) return login();
    const [person] =
      await database()`SELECT id,name,contact,relationship,message,diaper,gift,avatar,seat FROM participations WHERE google_owner=${session.owner_id}`;
    return person
      ? Response.json(person, { headers: { "Cache-Control": "no-store" } })
      : Response.json(
          {
            error:
              "Conclua sua participação pelo convite para criar seu perfil.",
          },
          { status: 404 },
        );
  } catch {
    return unavailable();
  }
}
export async function PATCH(request: Request) {
  try {
    const session = await sessionOwner();
    if (!session) return login();
    const { id, name, relationship, contact, message, diaper, gift } =
      await request.json();
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.length > 80 ||
      typeof relationship !== "string" ||
      relationship.trim().length < 2 ||
      relationship.length > 80 ||
      typeof contact !== "string" ||
      contact.length > 150 ||
      typeof message !== "string" ||
      message.length > 1000
    )
      return Response.json(
        { error: "Confira seus dados antes de salvar." },
        { status: 400 },
      );
    const sql = database();
    const saved = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(513280)`;
      const [old] =
        await tx`SELECT id,diaper,gift FROM participations WHERE google_owner=${session.owner_id} FOR UPDATE`;
      if (!old || id !== old.id) return false;
      const items = await tx<CatalogItem[]>`SELECT * FROM gift_stock`;
      if (
        old.diaper
          ? !validSelection(items, "diaper", diaper, old.diaper) ||
            !validSelection(items, "gift", gift, old.gift)
          : !!diaper || !!gift
      )
        return false;
      await tx`UPDATE participations SET name=${name.trim()},relationship=${relationship.trim()},contact=${contact.trim()},message=${message.trim()},diaper=${diaper || null},gift=${gift || null} WHERE id=${old.id}`;
      return true;
    });
    return saved
      ? Response.json({ ok: true })
      : Response.json(
          {
            error:
              "Essa troca não está disponível. Sua reserva anterior foi preservada.",
          },
          { status: 409 },
        );
  } catch {
    return unavailable();
  }
}
