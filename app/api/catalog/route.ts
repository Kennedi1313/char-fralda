import { randomUUID } from "node:crypto";
import { database } from "../../../lib/database";
import { isFamily } from "../../../lib/security";
import type { CatalogItem } from "../../../lib/catalog";
export async function GET() {
  try {
    return Response.json(
      await database()`SELECT id,kind,name,brands,quantity,active,reserved FROM gift_stock ORDER BY position`,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível carregar a lista." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!isFamily(request))
    return Response.json({ error: "Senha inválida." }, { status: 401 });
  try {
    const { id, createKey, kind, name, brands, quantity, active } = await request.json();
    if (
      (createKey !== undefined && (typeof createKey !== "string" || !/^[a-f0-9-]{36}$/.test(createKey))) ||
      (id !== undefined && typeof id !== "string") ||
      !["diaper", "gift"].includes(kind) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 80 ||
      !Array.isArray(brands) ||
      brands.length > 12 ||
      brands.some((b) => typeof b !== "string" || b.length > 80) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000 ||
      typeof active !== "boolean"
    )
      return Response.json(
        { error: "Confira o nome, as marcas e a quantidade." },
        { status: 400 },
      );
    const sql = database();
    const saved = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(513280)`;
      if (id !== undefined) {
        const [row] = await tx<
          CatalogItem[]
        >`SELECT kind,reserved FROM gift_stock WHERE id=${id}`;
        if (!row || row.kind !== kind || row.reserved > quantity) return false;
        await tx`UPDATE gift_catalog SET name=${name.trim()}, brands=${brands}, quantity=${quantity}, active=${active} WHERE id=${id}`;
      } else {
        await tx`INSERT INTO gift_catalog(id,kind,name,brands,quantity,active) VALUES(${createKey ?? randomUUID()},${kind},${name.trim()},${brands},${quantity},${active}) ON CONFLICT(id) DO NOTHING`;
      }
      return true;
    });
    return saved
      ? Response.json({ ok: true })
      : Response.json(
          {
            error:
              "Confira o item e mantenha uma quantidade igual ou maior que as reservas.",
          },
          { status: 409 },
        );
  } catch {
    return Response.json(
      { error: "Não foi possível salvar o item." },
      { status: 503 },
    );
  }
}
