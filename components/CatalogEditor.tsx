"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState, type FormEvent } from "react";
import { PackagePlus, Pencil, Archive, PackageCheck } from "lucide-react";
import { api, jsonRequest } from "../lib/client";
import type { CatalogItem } from "../lib/catalog";

type Draft = {
  id?: string;
  createKey?: string;
  kind: CatalogItem["kind"];
  name: string;
  brands: string;
  quantity: number;
  active: boolean;
};
const empty: Draft = {
  kind: "diaper",
  name: "",
  brands: "",
  quantity: 1,
  active: true,
};

export function CatalogEditor({
  items,
  password,
  reload,
}: {
  items: CatalogItem[];
  password: string;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const opener = useRef<HTMLButtonElement | null>(null);
  function edit(button: HTMLButtonElement, item?: CatalogItem) {
    opener.current = button;
    setNotice("");
    setDraft(item ? { ...item, brands: item.brands.join(", ") } : { ...empty,createKey:crypto.randomUUID() });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setNotice("");
    try {
      await api("/api/catalog", {
        ...jsonRequest({
          ...draft,
          brands: draft.brands
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + password,
        },
      });
      await reload();
      setDraft(null);
      setNotice("Lista atualizada.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="catalog-editor">
      <div className="panel-heading">
        <h2>Lista de presentes</h2>
        <button className="primary" onClick={(e) => edit(e.currentTarget)} disabled={busy}>
          <PackagePlus size={17} /> Novo item
        </button>
      </div>
      {notice && !draft && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <Dialog.Root open={!!draft} onOpenChange={(open) => {
        if (!open && !busy) {
          setDraft(null);
          setNotice("");
        }
      }}>
        {draft && <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog" aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}>

        <form className="catalog-form" onSubmit={save}>
          <Dialog.Title>{draft.id ? "Editar item" : "Novo item"}</Dialog.Title>
          <label>
            Nome do item
            <input
              id="catalog-name"
              required
              maxLength={80}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="field-pair">
            <label>
              Tipo
              <select
                disabled={!!draft.id}
                value={draft.kind}
                onChange={(e) =>
                  setDraft({ ...draft, kind: e.target.value as Draft["kind"] })
                }
              >
                <option value="diaper">Fralda</option>
                <option value="gift">Mimo</option>
              </select>
            </label>
            <label>
              Quantidade total
              <input
                required
                type="number"
                min={items.find((i) => i.id === draft.id)?.reserved ?? 0}
                max={100000}
                value={draft.quantity}
                onChange={(e) =>
                  setDraft({ ...draft, quantity: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label>
            Marcas indicadas <small>separe por vírgula</small>
            <input
              value={draft.brands}
              maxLength={500}
              onChange={(e) => setDraft({ ...draft, brands: e.target.value })}
            />
          </label>
          <label>
            Disponibilidade
            <select
              value={draft.active ? "active" : "archived"}
              onChange={(e) =>
                setDraft({ ...draft, active: e.target.value === "active" })
              }
            >
              <option value="active">Oferecer no convite</option>
              <option value="archived">
                Arquivar e manter reservas existentes
              </option>
            </select>
          </label>
          {notice && <p role="alert" className="notice">{notice}</p>}
          <div className="panel-buttons">
            <button
              className="secondary"
              type="button"
              onClick={() => { setNotice(""); setDraft(null); }}
              disabled={busy}
            >
              Cancelar
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "Salvando…" : "Salvar item"}
            </button>
          </div>
        </form>
          </Dialog.Content>
        </Dialog.Portal>}
      </Dialog.Root>
      {(["diaper", "gift"] as const).map((kind) => (
        <section key={kind} className="stock-group">
          <h3>{kind === "diaper" ? "Fraldas" : "Mimos"}</h3>
          <div className="stock-list">
            {items
              .filter((i) => i.kind === kind)
              .map((i) => (
                <article key={i.id} className="stock-item">
                  <div className="stock-glyph">
                    {i.active ? (
                      <PackageCheck size={19} />
                    ) : (
                      <Archive size={19} />
                    )}
                  </div>
                  <div>
                    <strong>{i.name}</strong>
                    <small>{i.brands.join(" · ") || "Marca livre"}</small>
                  </div>
                  <div className="stock-count">
                    <span>
                      {i.reserved} de {i.quantity} reservados
                    </span>
                    <small>
                      {i.active
                        ? i.quantity - i.reserved + " disponíveis"
                        : "Arquivado"}
                    </small>
                  </div>
                  <button
                    className="icon-action"
                    aria-label={"Editar " + i.name}
                    onClick={(e) => edit(e.currentTarget, i)}
                    disabled={busy}
                  >
                    <Pencil size={16} />
                  </button>
                </article>
              ))}
          </div>
        </section>
      ))}
    </section>
  );
}
