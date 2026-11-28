import { sessionOwner } from "../../../lib/garden-session";
import { database } from "../../../lib/database";
import { hash } from "../../../lib/security";
import { SEAT_COUNT } from "../../../lib/types";
import { isValidAvatar } from "../../../lib/character";
export async function POST(request: Request) {
  try {
    const { id, token, seat, avatar, avatarOnly } = await request.json();
    if (
      typeof id !== "string" ||
      (token !== undefined && typeof token !== "string") ||
      (avatarOnly !== true &&
        (!Number.isInteger(seat) || seat < 1 || seat > SEAT_COUNT)) ||
      !isValidAvatar(avatar)
    )
      return Response.json(
        { error: "Escolha um avatar e uma cadeira válidos." },
        { status: 400 },
      );
    const sql = database();
    const session = await sessionOwner();
    const owner = session?.owner_id ?? null;
    const guestHash =
      typeof token === "string" && token.length === 64 ? hash(token) : null;
    const rows =
      await sql`UPDATE participations SET avatar = ${sql.json(avatar)},
      seat = CASE WHEN ${avatarOnly === true} THEN seat ELSE ${seat ?? null}::integer END
      WHERE id = ${id} AND (google_owner = ${owner} OR
        (google_owner IS NULL AND token_hash = ${guestHash} AND guest_edit_until > now() AND
          (seat IS NULL OR (${avatarOnly !== true} AND seat = ${seat ?? null} AND avatar = ${sql.json(avatar)}))))
      RETURNING id`;
    return rows.length
      ? Response.json({ ok: true })
      : Response.json(
          { error: "Entre com a conta vinculada para editar este personagem." },
          { status: 403 },
        );
  } catch (error) {
    const conflict = (error as { code?: string }).code === "23505";
    return Response.json(
      {
        error: conflict
          ? "Essa cadeira acabou de ser ocupada. Escolha outra."
          : "Não foi possível salvar seu lugar. Tente novamente.",
      },
      { status: conflict ? 409 : 503 },
    );
  }
}
