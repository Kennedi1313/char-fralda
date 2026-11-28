import {
  sessionOwner,
  closeSession,
  accountProfile,
} from "../../../../lib/garden-session";

export async function GET() {
  const session = await sessionOwner();
  return Response.json(
    session
      ? await accountProfile(session.owner_id, session.display_name)
      : null,
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function DELETE() {
  await closeSession();
  return Response.json({ ok: true });
}
