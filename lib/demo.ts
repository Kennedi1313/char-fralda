import { CUSTOM_GIFT_PREFIX, diapers, gifts } from "../data/items";
import { palette, Participation } from "./types";

import { validSelection,type CatalogItem } from "./catalog";
const catalog:CatalogItem[]=[...diapers,...gifts].map(i=>({...i,kind:i.category==="diaper"?"diaper":"gift",active:true,reserved:0}));

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
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
  "Estêvão, que sua vida seja cheia de descobertas e abraços. Estamos te esperando! 💚",
  "Já tem muita gente torcendo por você, pequeno!",
  "Preparei um carinho especial. Um beijo enorme em toda a família.",
  "O colo da vovó já está reservado. Vem com muita saúde, meu amor!",
  "Que esse jardim seja só o começo de tantas memórias bonitas.",
  "Um mundo de coisas lindas te espera, Estêvão! 🌻",
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
  const stock=catalog.map(i=>({...i,reserved:rows.filter(r=>r.diaper===i.id||r.gift===i.id).length}));
  if(url.includes("/api/profile"))throw Error("Entre com o Google pelo convite para acessar seu perfil.");
  if(url.includes("/api/catalog")){
    if(options?.method!=="POST")return stock as T;
    const index=catalog.findIndex(i=>i.id===body.id);
    if(index>=0 && body.quantity<stock[index].reserved)throw Error("A quantidade deve incluir as reservas existentes.");
    const next={...body,id:body.id??crypto.randomUUID(),reserved:0};
    if(index>=0)catalog[index]=next;else catalog.push(next);
    return {ok:true} as T;
  }
  if(url.includes("availability"))return Object.fromEntries(stock.map(i=>[i.id,i.reserved])) as T;
  if (url.includes("seats")) {
    const person = rows.find((row) => row.id === body.id);
    if (!person) throw new Error("Confirme sua participação primeiro.");
    if (body.avatarOnly === true) {
      person.avatar = body.avatar;
      return { ok: true } as T;
    }
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
      body.sponsor != null ? !rows.some(row=>row.id===body.sponsor.split(".")[0] && row.diaper)
        : !validSelection(stock,"diaper",body.diaper) || !validSelection(stock,"gift",body.gift)
    ) throw new Error("Confira os presentes disponíveis.");
    if (!rows.some((row) => row.id === body.id)) {
      const { token: _token, ...participation } = body;
      rows.push({
        ...participation,
        sponsorId: body.sponsor?.split(".")[0],
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
