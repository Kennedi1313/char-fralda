import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { database } from "./database";
import { hash } from "./security";

const cookieName = "garden_session";
export async function sessionOwner() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const sql = database();
  const [session] =
    await sql`SELECT owner_id, display_name FROM garden_sessions WHERE token_hash = ${hash(token)} AND expires_at > now()`;
  return session ?? null;
}
export async function closeSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await database()`DELETE FROM garden_sessions WHERE token_hash = ${hash(token)}`;
  jar.delete(cookieName);
}
export async function openSession(owner: string, name: string) {
  const token = randomBytes(32).toString("hex");
  const sql = database();
  await closeSession();
  await sql`DELETE FROM garden_sessions WHERE expires_at <= now()`;
  await sql`INSERT INTO garden_sessions VALUES (${hash(token)}, ${owner}, ${name}, now() + interval '30 days')`;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
}
export async function accountProfile(owner: string, name: string) {
  const [p] =
    await database()`SELECT id, name, diaper IS NULL AS family, token_hash, avatar, seat FROM participations WHERE google_owner = ${owner}`;
  return {
    receipt: {
      id: p?.id ?? owner,
      name: p?.name ?? name,
      family: p?.family ?? false,
      inviteProof: p && !p.family ? hash("family:" + p.token_hash) : undefined,
    },
    registered: !!p,
    avatar: p?.avatar ?? null,
    seat: p?.seat ?? null,
  };
}
