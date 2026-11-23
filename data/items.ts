export type GiftItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  url?: string;
  size?: string;
  brands: string[];
  unit: string;
  details: string[];
  category: "diaper" | "care" | "clothing" | "book";
};
// Edite as metas e links aqui. Preserve IDs que já tenham reservas.
export const diapers: GiftItem[] = [
  {
    id: "p",
    name: "Fralda P",
    description: "Um pacote de carinho pequenininho",
    quantity: 10,
    size: "P",
    brands: ["Pampers", "Huggies", "MamyPoko"],
    unit: "1 pacote fechado",
    details: [
      "Escolha uma das marcas indicadas.",
      "A quantidade de fraldas pode variar por pacote.",
    ],
    category: "diaper",
  },
  {
    id: "m",
    name: "Fralda M",
    description: "Para muitas descobertas",
    quantity: 25,
    size: "M",
    brands: ["Pampers", "Huggies", "MamyPoko"],
    unit: "1 pacote fechado",
    details: [
      "O tamanho que mais precisamos na lista de exemplo.",
      "Não é necessário escolher a marca agora.",
    ],
    category: "diaper",
  },
  {
    id: "g",
    name: "Fralda G",
    description: "Acompanhando cada novidade",
    quantity: 20,
    size: "G",
    brands: ["Pampers", "Huggies"],
    unit: "1 pacote fechado",
    details: [
      "Pode escolher a linha que preferir.",
      "Confira o tamanho G na embalagem.",
    ],
    category: "diaper",
  },
  {
    id: "xg",
    name: "Fralda XG",
    description: "Para quando eu crescer um pouco",
    quantity: 10,
    size: "XG",
    brands: ["Pampers", "Huggies"],
    unit: "1 pacote fechado",
    details: [
      "Para acompanhar os próximos meses.",
      "Confira o tamanho XG na embalagem.",
    ],
    category: "diaper",
  },
];
export const gifts: GiftItem[] = [
  {
    id: "lenco",
    name: "Lenços umedecidos",
    description: "Um pacote para o dia a dia",
    quantity: 15,
    brands: ["Marca a combinar"],
    unit: "1 pacote",
    details: [
      "Exemplo: embalagem com tampa.",
      "Modelo e marca serão definidos pela família.",
    ],
    category: "care",
  },
  {
    id: "pomada",
    name: "Pomada",
    description: "Cuidado com a minha pele",
    quantity: 8,
    brands: ["A definir pela família"],
    unit: "1 unidade",
    details: [
      "Reserve o carinho; confirme o produto antes da compra.",
      "Modelo e tamanho da embalagem ainda serão definidos.",
    ],
    category: "care",
  },
  {
    id: "body",
    name: "Body P",
    description: "Um abraço em forma de roupinha",
    quantity: 6,
    brands: ["Livre escolha"],
    unit: "1 peça • tamanho P",
    details: [
      "Exemplo: body de algodão, manga curta.",
      "Cores claras ou estampas delicadas são bem-vindas.",
    ],
    category: "clothing",
  },
  {
    id: "livro",
    name: "Livro infantil",
    description: "Nossa próxima história favorita",
    quantity: 5,
    brands: ["Livre escolha"],
    unit: "1 livro",
    details: [
      "Exemplo: livro de pano ou cartonado.",
      "Pode deixar uma dedicatória para o Estevão.",
    ],
    category: "book",
  },
];
export const CUSTOM_GIFT_PREFIX = "custom:";
export const CUSTOM_GIFT_MAX_LENGTH = 200;
export function isValidGift(gift: unknown): gift is string | undefined | null {
  if (gift === undefined || gift === null || gift === "") return true;
  if (typeof gift !== "string") return false;
  if (gifts.some((item) => item.id === gift)) return true;
  if (!gift.startsWith(CUSTOM_GIFT_PREFIX)) return false;
  const description = gift.slice(CUSTOM_GIFT_PREFIX.length);
  return (
    description.trim().length > 0 &&
    description.length <= CUSTOM_GIFT_MAX_LENGTH
  );
}
export const itemName = (id?: string) =>
  id?.startsWith(CUSTOM_GIFT_PREFIX)
    ? id.slice(CUSTOM_GIFT_PREFIX.length)
    : ([...diapers, ...gifts].find((item) => item.id === id)?.name ??
      "Sem mimo");
