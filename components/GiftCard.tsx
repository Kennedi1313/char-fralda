import { GiftItem } from "../data/items";

function ProductArt({ item }: { item: GiftItem }) {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      className={`product-art art-${item.category}`}
    >
      <ellipse
        cx="80"
        cy="106"
        rx="51"
        ry="7"
        fill="currentColor"
        opacity=".1"
      />
      {item.category === "diaper" ? (
        <>
          <path
            d="M35 22h90l8 15v62H27V37z"
            fill="#fffdf5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M27 44h106v33H27z" fill="currentColor" opacity=".15" />
          <path
            d="M35 22l7 15h76l7-15M42 37v7m76-7v7"
            fill="none"
            stroke="currentColor"
            opacity=".4"
          />
          <text
            x="80"
            y="68"
            textAnchor="middle"
            fontSize="25"
            fontFamily="Georgia"
            fill="currentColor"
          >
            {item.size}
          </text>
        </>
      ) : item.category === "clothing" ? (
        <>
          <path
            d="M57 20L27 37l13 22 16-8v30l14 20h20l14-20V51l16 8 13-22-30-17c-8 16-38 16-46 0z"
            fill="#fffdf5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M70 89h20M80 54v15m-7-7h14"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      ) : item.category === "book" ? (
        <>
          <path
            d="M35 18h90v84H35z"
            fill="#fffdf5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M44 18v84" stroke="currentColor" />
          <circle cx="83" cy="52" r="18" fill="currentColor" opacity=".15" />
          <path
            d="M74 52l6 6 12-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text
            x="84"
            y="84"
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
          >
            ERA UMA VEZ…
          </text>
        </>
      ) : (
        <>
          <rect
            x="29"
            y="35"
            width="102"
            height="62"
            rx="15"
            fill="#fffdf5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="58"
            y="29"
            width="44"
            height="18"
            rx="6"
            fill="#e4eadb"
            stroke="currentColor"
          />
          <path
            d="M70 66q10-18 20 0-10 18-20 0"
            fill="currentColor"
            opacity=".35"
          />
          <path d="M40 86h80" stroke="currentColor" opacity=".2" />
        </>
      )}
    </svg>
  );
}
export function GiftCard({
  item,
  checked,
  onChange,
  group,
  counts,
  required = false,
}: {
  item: GiftItem;
  checked: boolean;
  onChange: () => void;
  group: string;
  counts: Record<string, number>;
  required?: boolean;
}) {
  const remaining = Math.max(0, item.quantity - (counts[item.id] || 0));
  return (
    <article
      className={`gift-card ${checked ? "selected" : ""} ${!remaining ? "unavailable" : ""}`}
    >
      <label>
        <input
          type="radio"
          name={group}
          required={required}
          checked={checked}
          disabled={!remaining}
          onChange={onChange}
        />
        <ProductArt item={item} />
        <div className="gift-card-copy">
          <span className="gift-unit">{item.unit}</span>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <div className="brand-chips">
            {item.brands.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
          <ul>
            {item.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <div className="gift-availability">
            <span>
              {remaining
                ? `${remaining} ${remaining === 1 ? "disponível" : "disponíveis"}`
                : "Todas as unidades reservadas"}
            </span>
            <strong>{checked ? "Escolhido ✓" : "Selecionar"}</strong>
          </div>
        </div>
      </label>
      {item.url && (
        <a
          className="gift-shop-link"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          Ver produto na loja
        </a>
      )}
    </article>
  );
}
