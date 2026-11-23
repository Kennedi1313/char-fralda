"use client";
import { FormEvent, useState } from "react";
import { api, jsonRequest } from "../../lib/client";
import { Participation } from "../../lib/types";
import { Garden } from "../../components/Garden";
import { GuestDialog } from "../../components/GuestDialog";
import { itemName } from "../../data/items";
import { DEMO_MODE } from "../../lib/demo";
import { Trash2 } from "lucide-react";
export default function Family() {
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
      await api("/api/participations", { ...jsonRequest({ id: person.id }), method: "DELETE", headers: { Authorization: `Bearer ${password}`, "Content-Type": "application/json" } });
      setGuests((current) => current?.filter((item) => item.id !== person.id) ?? null);
      if (guest?.id === person.id) setGuest(null);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <main className="shell family">
      <a href="/" className="brand">
        ✿ jardim do estevão
      </a>
      <p className="eyebrow">SÓ PARA A FAMÍLIA</p>
      <h1>
        Todos os carinhos,
        <br />
        em um só lugar.
      </h1>
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
            <button className="secondary" disabled={busy} onClick={() => load()}>
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
          <h2>Lista de participações</h2>
          <p>
            Todos aparecem aqui, inclusive quem preferiu não entrar no jardim.
          </p>
          <div className="guest-list">
            {guests.map((person) => (
              <article className="guest-card" key={person.id}>
                <button className="guest-card-main" onClick={() => setGuest(person)}>
                  <strong>{person.name}</strong>
                  {person.relationship && <span>{person.relationship}</span>}
                  <span>{itemName(person.diaper)} · {itemName(person.gift)}</span>
                  <small>{person.seat ? `Cadeira ${person.seat}` : "Sem cadeira"}</small>
                </button>
                <button className="delete-guest" aria-label={`Apagar ${person.name}`} title="Apagar participação" disabled={busy} onClick={() => remove(person)}>
                  <Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />
                </button>
              </article>
            ))}
            {!guests.length && <p>Os primeiros carinhos vão aparecer aqui.</p>}
          </div>
          <h2>O jardim do Estevão</h2>
          <Garden
            guests={guests}
            onSeat={(_, person) => person && setGuest(person)}
          />
          <GuestDialog guest={guest} close={() => setGuest(null)} family />
        </>
      )}
    </main>
  );
}
