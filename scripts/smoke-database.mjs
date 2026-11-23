// Run only after migrations, with the real server using the same DATABASE_URL.
// Requires Node 22.18+ (native TypeScript imports). No migrations are performed.
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import nextEnv from "@next/env";
import { diapers, gifts, CUSTOM_GIFT_PREFIX } from "../data/items.ts";
import { defaultAvatar, SEAT_COUNT } from "../lib/types.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(
  fileURLToPath(new URL("../", import.meta.url)),
  process.env.NODE_ENV !== "production",
  {
    info() {},
    error() {},
  },
);

const identities = Array.from({ length: 2 }, () => {
  const token = randomBytes(32).toString("hex");
  return {
    id: randomUUID(),
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
  };
});
const catalogIds = new Set([...diapers, ...gifts].map((item) => item.id));
let sql;
let stage = "configuration";
let passed = false;
const check = (condition) => {
  if (!condition) throw new Error("Smoke assertion failed");
};

try {
  check(process.env.DATABASE_URL && process.env.FAMILY_PASSWORD);
  const base = new URL(process.env.API_BASE_URL || "http://localhost:3001");
  check(
    ["http:", "https:"].includes(base.protocol) &&
      !base.username &&
      !base.password,
  );
  sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 15,
    onnotice() {},
  });

  async function request(path, { body, family = false, status = 200 } = {}) {
    const response = await fetch(new URL(path, base), {
      method: body ? "POST" : "GET",
      redirect: "error",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(family
          ? { Authorization: `Bearer ${process.env.FAMILY_PASSWORD}` }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });
    check(response.status === status);
    return response.json();
  }
  function checkAvailability(counts) {
    check(counts && typeof counts === "object" && !Array.isArray(counts));
    check(
      Object.entries(counts).every(
        ([id, count]) =>
          catalogIds.has(id) && Number.isInteger(count) && count >= 0,
      ),
    );
  }

  stage = "read-only preflight";
  const familyBefore = await request("/api/participations?family", {
    family: true,
  });
  check(Array.isArray(familyBefore));
  const occupied =
    await sql`SELECT seat FROM participations WHERE seat IS NOT NULL`;
  const occupiedSeats = new Set(
    [...occupied, ...familyBefore].map((row) => row.seat),
  );
  const freeSeats = Array.from(
    { length: SEAT_COUNT },
    (_, index) => index + 1,
  ).filter((seat) => !occupiedSeats.has(seat));
  check(freeSeats.length > 0);
  const availability = await request("/api/availability");
  checkAvailability(availability);
  const remaining = diapers.flatMap((item) =>
    Array.from(
      {
        length: Math.min(
          2,
          Math.max(0, item.quantity - (availability[item.id] || 0)),
        ),
      },
      () => item.id,
    ),
  );
  check(remaining.length >= 2);
  const existing =
    await sql`SELECT id FROM participations WHERE id IN ${sql(identities.map((person) => person.id))}`;
  check(existing.length === 0);

  stage = "create test guests";
  for (const [index, identity] of identities.entries()) {
    await request("/api/participations", {
      status: 201,
      body: {
        id: identity.id,
        token: identity.token,
        name: `Smoke test ${index + 1}`,
        contact: "",
        relationship: "Amigo de teste",
        diaper: remaining[index],
        gift: `${CUSTOM_GIFT_PREFIX}Manta de teste ${identity.id}`,
        message: `Recado de teste ${identity.id}`,
        publicMessage: false,
      },
    });
    // Check each write immediately: HTTP and cleanup must use the same database.
    const stored =
      await sql`SELECT id FROM participations WHERE id = ${identity.id} AND token_hash = ${identity.tokenHash}`;
    check(stored.length === 1);
  }

  stage = "family and public visibility";
  const family = await request("/api/participations?family", { family: true });
  const publicGuests = await request("/api/participations");
  for (const identity of identities) {
    const privateGuest = family.find((row) => row.id === identity.id);
    const publicGuest = publicGuests.find((row) => row.id === identity.id);
    check(privateGuest?.relationship === "Amigo de teste");
    check(
      privateGuest?.gift ===
        `${CUSTOM_GIFT_PREFIX}Manta de teste ${identity.id}`,
    );
    check(
      publicGuest?.message === `Recado de teste ${identity.id}` &&
        publicGuest.publicMessage === true,
    );
    check(
      [
        "gift",
        "diaper",
        "relationship",
        "contact",
        "token",
        "token_hash",
      ].every((key) => !(key in publicGuest)),
    );
  }
  stage = "availability privacy";
  checkAvailability(await request("/api/availability"));

  stage = "seat reservation";
  // Recheck immediately before reserving; a race is rejected by the unique constraint.
  const occupiedNow =
    await sql`SELECT seat FROM participations WHERE seat IS NOT NULL`;
  const seat = freeSeats.find(
    (candidate) => !occupiedNow.some((row) => row.seat === candidate),
  );
  check(seat !== undefined);
  const seatBody = (identity) => ({
    id: identity.id,
    token: identity.token,
    seat,
    avatar: defaultAvatar,
  });
  await request("/api/seats", { body: seatBody(identities[0]) });
  stage = "seat conflict";
  await request("/api/seats", { body: seatBody(identities[1]), status: 409 });
  const seated =
    await sql`SELECT id, seat FROM participations WHERE id IN ${sql(identities.map((person) => person.id))}`;
  check(seated.find((row) => row.id === identities[0].id)?.seat === seat);
  check(seated.find((row) => row.id === identities[1].id)?.seat === null);
  passed = true;
} catch {
  // Never log raw errors, response bodies, environment values, or connection URLs.
  console.error(`Database smoke test failed during: ${stage}.`);
  process.exitCode = 1;
} finally {
  if (sql) {
    try {
      for (const identity of identities) {
        await sql`DELETE FROM participations WHERE id = ${identity.id} AND token_hash = ${identity.tokenHash}`;
      }
      console.log("Test-owned database records cleaned up.");
    } catch {
      console.error(
        "Cleanup failed; inspect only these test IDs:",
        identities.map((person) => person.id).join(", "),
      );
      process.exitCode = 1;
    } finally {
      await sql.end({ timeout: 5 }).catch(() => {
        process.exitCode = 1;
      });
    }
  }
}
if (passed && !process.exitCode) console.log("Database smoke test passed.");
