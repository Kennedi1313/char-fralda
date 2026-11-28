import { createHmac } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { database } from "../../../../lib/database";
import { hash } from "../../../../lib/security";

import { accountProfile, openSession } from "../../../../lib/garden-session";

const google = new OAuth2Client();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  const audience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const key = process.env.GOOGLE_PARTICIPATION_KEY;
  if (
    !audience ||
    !key ||
    key.length < 32 ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  )
    return Response.json(
      {
        error:
          "A entrada com Google está indisponível. Você pode continuar sem conta.",
      },
      { status: 503 },
    );
  let claim: { id: string; token: string } | undefined;
  let subject: string;
  let givenName: string;
  try {
    const body = await request.json();
    const { credential } = body;
    claim = body.claim;
    if (
      claim &&
      (!/^[a-f0-9-]{36}$/.test(claim.id) || !/^[a-f0-9]{64}$/.test(claim.token))
    )
      throw Error();
    if (typeof credential !== "string" || credential.length > 16000)
      throw Error();
    const ticket = await google.verifyIdToken({
      idToken: credential,
      audience,
    });
    const profile = ticket.getPayload();
    if (!profile?.sub) throw Error();
    subject = profile.sub;
    givenName = profile.name ?? "";
  } catch {
    return Response.json(
      { error: "Não conseguimos verificar sua conta. Tente novamente." },
      { status: 401 },
    );
  }
  // Keep the existing receipt protocol. Separate derivations keep the public ID
  // independent of the private editing credential across devices.
  const derive = (purpose: string) =>
    createHmac("sha256", key)
      .update(purpose + ":" + subject)
      .digest("hex");
  const hex = derive("id").slice(0, 32);
  const id = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
  const token = derive("receipt");
  try {
    const sql = database();
    const linked = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(513280)`;
      // Recognize Google participants created before explicit account ownership.
      await tx`UPDATE participations SET google_owner = ${id} WHERE id = ${id} AND token_hash = ${hash(token)} AND google_owner IS NULL`;
      if (!claim) return true;
      const [existing] =
        await tx`SELECT id FROM participations WHERE google_owner = ${id}`;
      if (existing) return existing.id === claim.id;
      const rows =
        await tx`UPDATE participations SET google_owner = ${id}, guest_edit_until = NULL
        WHERE id = ${claim.id} AND google_owner IS NULL AND token_hash = ${hash(claim.token)}
        AND guest_edit_until > now() AND seat IS NOT NULL RETURNING id`;
      return rows.length === 1;
    });
    if (!linked)
      return Response.json(
        {
          error:
            "Não foi possível vincular este lugar. A conta pode já ter outra participação ou o convite de vínculo expirou.",
        },
        { status: 409 },
      );
    await openSession(id, givenName);
    return Response.json(await accountProfile(id, givenName), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Seu cadastro não pôde ser consultado. Tente novamente." },
      { status: 503 },
    );
  }
}
