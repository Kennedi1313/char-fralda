import type { GiftItem } from "../data/items";

type Props = {
  item: Pick<GiftItem,"id"|"name"|"quantity"|"brands">;
  counts: Record<string, number>;
  checked: boolean;
  group: "diaper" | "gift";
  onChange: () => void;
};

export function GiftCard({ item, counts, checked, group, onChange }: Props) {
  const remaining = Math.max(0, item.quantity - (counts[item.id] ?? 0));
  return (
    <label className="diaper-tile">
      <input type="radio" name={group} required={group === "diaper"}
        checked={checked} disabled={!remaining} onChange={onChange} />
      <strong>{item.name}</strong>
      <small>{remaining} {remaining === 1 ? "disponível" : "disponíveis"}</small>
      <span>{item.brands.join(" · ")}</span>
    </label>
  );
}
