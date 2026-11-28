"use client";
import { FormEvent, useState } from "react";
import { api, jsonRequest } from "../../lib/client";
import { Participation } from "../../lib/types";
import { GuestDialog } from "../../components/GuestDialog";
import { catalogName, type CatalogItem } from "../../lib/catalog";
import { CatalogEditor } from "../../components/CatalogEditor";
import { DEMO_MODE } from "../../lib/demo";
import { Trash2 } from "lucide-react";
export default function Family() {
  const [tab, setTab] = useState<"catalog" | "guests">("catalog");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const reloadCatalog = async () =>
    setItems(await api<CatalogItem[]>("/api/catalog"));
  const [password, setPassword] = useState(DEMO_MODE ? "demo" : "");
  const [guests, setGuests] = useState<Participation[] | null>(null);
  const [guest, setGuest] = useState<Participation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await reloadCatalog();
      setGuests(
        await api<Participation[]>("/api/participations?family=1", {
          headers: { Authorization: `Bearer ${password}` },
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(person: Participation) {
    if (!window.confirm(`Apagar a participação de ${person.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/participations", {
        ...jsonRequest({ id: person.id }),
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${password}`,
          "Content-Type": "application/json",
        },
      });
      setGuests(
        (current) => current?.filter((item) => item.id !== person.id) ?? null,
      );
      if (guest?.id === person.id) setGuest(null);
      await reloadCatalog();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="shell family">
      <a href="/" className="brand">
        ✿ jardim do Estêvão
      </a>
      <h1>Painel da família</h1>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {guests === null ? (
        <form onSubmit={load}>
          <label>
            Senha da família
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : (
        <>
          <p>
            {guests.length} participações ·{" "}
            {guests.filter((g) => g.seat).length} cadeiras ocupadas
          </p>
          <div className="family-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => load()}
            >
              Atualizar
            </button>
            <button
              className="text-button"
              onClick={() => {
                setGuests(null);
                setPassword("");
              }}
            >
              Sair
            </button>
          </div>
          <nav className="panel-tabs" aria-label="Seções da família">
            <button
              aria-pressed={tab === "catalog"}
              onClick={() => setTab("catalog")}
            >
              Lista de presentes
            </button>
            <button
              aria-pressed={tab === "guests"}
              onClick={() => setTab("guests")}
            >
              Convidados ({guests.length})
            </button>
          </nav>
          {tab === "catalog" ? (
            <CatalogEditor
              items={items}
              password={password}
              reload={reloadCatalog}
            />
          ) : (
            <>
              <h2>Lista de participações</h2>
              <p>
                Todos aparecem aqui, inclusive quem preferiu não entrar no
                jardim.
              </p>
              <div className="guest-list">
                {guests.map((person) => (
                  <article className="guest-card" key={person.id}>
                    <button
                      className="guest-card-main"
                      onClick={() => setGuest(person)}
                    >
                      <strong>{person.name}</strong>
                      {person.relationship && (
                        <span>{person.relationship}</span>
                      )}
                      <span>
                        {person.diaper
                          ? [
                              catalogName(items, person.diaper),
                              catalogName(items, person.gift),
                            ].join(" · ")
                          : "Acompanhante" +
                            (person.sponsorId
                              ? " de " +
                                (guests.find((g) => g.id === person.sponsorId)
                                  ?.name ?? "familiar")
                              : "")}
                      </span>
                      <small>
                        {person.seat ? `Cadeira ${person.seat}` : "Sem cadeira"}
                      </small>
                    </button>
                    <button
                      className="delete-guest"
                      aria-label={`Apagar ${person.name}`}
                      title="Apagar participação"
                      disabled={busy}
                      onClick={() => remove(person)}
                    >
                      <Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />
                    </button>
                  </article>
                ))}
                {!guests.length && (
                  <p>Os primeiros carinhos vão aparecer aqui.</p>
                )}
              </div>
            </>
          )}
          <a className="account-back" href="/jardim">
            Visitar o jardim
          </a>
          <GuestDialog
            guest={guest}
            catalog={items}
            close={() => setGuest(null)}
            family
          />
        </>
      )}
    </main>
  );
}
