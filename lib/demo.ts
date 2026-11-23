import { CUSTOM_GIFT_PREFIX, diapers, gifts, isValidGift } from "../data/items";
import { palette, Participation } from "./types";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const RECEIPT_KEY = DEMO_MODE
  ? "estevao-demo-receipt"
  : "estevao-receipt";
export const AVATAR_KEY = DEMO_MODE ? "estevao-demo-avatar" : "estevao-avatar";
export const SEAT_KEY = DEMO_MODE ? "estevao-demo-seat" : "estevao-seat";
export const DEMO_KEY = "estevao-demo-guests-v1";
let sessionGuests: Participation[] | undefined;

const names = [
  "Ana Clara",
  "Pedro",
  "Tia Marina",
  "Vovó Rosa",
  "Lucas",
  "Beatriz",
  "Tio Rafael",
  "Camila",
  "Júlia",
  "Gabriel",
  "Dinda Luiza",
  "Vovô José",
];
const messages = [
  "Estevão, que sua vida seja cheia de descobertas e abraços. Estamos te esperando! 💚",
  "Já tem muita gente torcendo por você, pequeno!",
  "Preparei um carinho especial. Um beijo enorme em toda a família.",
  "O colo da vovó já está reservado. Vem com muita saúde, meu amor!",
  "Que esse jardim seja só o começo de tantas memórias bonitas.",
  "Um mundo de coisas lindas te espera, Estevão! 🌻",
];
export function demoGuests(): Participation[] {
  if (sessionGuests) return sessionGuests;
  sessionGuests = names.map((name, i) => ({
    id: `demo-${i}`,
    name,
    contact: `convidado${i + 1}@example.com`,
    relationship: [
      "Prima",
      "Amigo da família",
      "Tia",
      "Avó",
      "Primo",
      "Amiga da família",
      "Tio",
      "Prima",
      "Amiga da família",
      "Primo",
      "Madrinha",
      "Avô",
    ][i],
    message: messages[i % messages.length],
    publicMessage: true,
    diaper: diapers[i % diapers.length].id,
    gift: i % 3 === 0 ? undefined : gifts[i % gifts.length].id,
    seat: i < 9 ? [1, 3, 6, 9, 12, 18, 25, 30, 37][i] : null,
    avatar:
      i < 9
        ? {
            skin: palette.skin[i % 4],
            hair: palette.hair[i % 5],
            shirt: palette.shirt[i % 5],
            style: i % 3,
          }
        : null,
  }));
  return sessionGuests;
}

// Adaptador exclusivo da demonstração. As rotas reais continuam usando Postgres.
export async function demoApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const rows = demoGuests();
  const body = options?.body ? JSON.parse(String(options.body)) : null;
  if (url.includes("availability")) {
    const counts: Record<string, number> = {};
    rows.forEach((row) =>
      [row.diaper, row.gift].forEach((id) => {
        if (id && [...diapers, ...gifts].some((item) => item.id === id))
          counts[id] = (counts[id] ?? 0) + 1;
      }),
    );
    return counts as T;
  }
  if (url.includes("seats")) {
    const person = rows.find((row) => row.id === body.id);
    if (!person) throw new Error("Confirme sua participação primeiro.");
    if (rows.some((row) => row.seat === body.seat && row.id !== body.id))
      throw new Error("Essa cadeira já está ocupada.");
    person.seat = body.seat;
    person.avatar = body.avatar;
    return { ok: true } as T;
  }
  if (options?.method === "DELETE") {
    sessionGuests = rows.filter((row) => row.id !== body?.id);
    return { ok: true } as T;
  }
  if (options?.method === "POST") {
    if (
      !isValidGift(body.gift) ||
      !diapers.some((item) => item.id === body.diaper)
    )
      throw new Error("Confira os campos preenchidos.");
    if (!rows.some((row) => row.id === body.id)) {
      for (const item of [
        diapers.find((item) => item.id === body.diaper),
        gifts.find((item) => item.id === body.gift),
      ]) {
        if (
          item &&
          rows.filter((row) => row.diaper === item.id || row.gift === item.id)
            .length >= item.quantity
        )
          throw new Error(
            "Um dos presentes acabou de ser reservado. Escolha outro.",
          );
      }
      const { token: _token, ...participation } = body;
      rows.push({
        ...participation,
        gift: body.gift?.startsWith(CUSTOM_GIFT_PREFIX)
          ? CUSTOM_GIFT_PREFIX +
            body.gift.slice(CUSTOM_GIFT_PREFIX.length).trim()
          : body.gift || undefined,
        publicMessage: true,
        seat: null,
        avatar: null,
      });
    }
    return { id: body.id } as T;
  }
  if (url.includes("family")) return rows as T;
  return rows.map(({ id, name, seat, avatar, message }) => ({
    id,
    name,
    seat,
    avatar,
    publicMessage: true,
    message,
  })) as T;
}
