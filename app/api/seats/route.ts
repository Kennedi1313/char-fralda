import { database } from "../../../lib/database";
import { hash } from "../../../lib/security";
import { SEAT_COUNT } from "../../../lib/types";
import { isValidAvatar } from '../../../lib/character';
export async function POST(request: Request) {
  try {
    const { id, token, seat, avatar } = await request.json();
    if (
      typeof id !== "string" ||
      typeof token !== "string" ||
      !Number.isInteger(seat) ||
      seat < 1 ||
      seat > SEAT_COUNT ||
      !isValidAvatar(avatar)
    )
      return Response.json(
        { error: "Escolha um avatar e uma cadeira válidos." },
        { status: 400 },
      );
    const sql = database();
    const rows =
      await sql`UPDATE participations SET seat = ${seat}, avatar = ${sql.json(avatar)} WHERE id = ${id} AND token_hash = ${hash(token)} RETURNING id`;
    return rows.length
      ? Response.json({ ok: true })
      : Response.json(
          { error: "Confirme sua participação primeiro neste navegador." },
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
