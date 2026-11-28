import { CUSTOM_GIFT_PREFIX, CUSTOM_GIFT_MAX_LENGTH } from "../data/items";
export type CatalogItem = {
  id: string;
  kind: "diaper" | "gift";
  name: string;
  brands: string[];
  quantity: number;
  active: boolean;
  reserved: number;
};
export function catalogName(items: CatalogItem[], id?: string | null) {
  if (!id) return "Sem mimo";
  return id.startsWith(CUSTOM_GIFT_PREFIX)
    ? id.slice(CUSTOM_GIFT_PREFIX.length)
    : (items.find((item) => item.id === id)?.name ?? id);
}
export function validSelection(
  items: CatalogItem[],
  kind: CatalogItem["kind"],
  id: unknown,
  previous?: string | null,
) {
  if (kind === "gift" && (id == null || id === "")) return true;
  if (typeof id !== "string" || !id) return false;
  if (kind === "gift" && id.startsWith(CUSTOM_GIFT_PREFIX)) {
    const text = id.slice(CUSTOM_GIFT_PREFIX.length);
    return !!text.trim() && text.length <= CUSTOM_GIFT_MAX_LENGTH;
  }
  const item = items.find((row) => row.kind === kind && row.id === id);
  return (
    !!item &&
    (id === previous || (item.active && item.reserved < item.quantity))
  );
}
