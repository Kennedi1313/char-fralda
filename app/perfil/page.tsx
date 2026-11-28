"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Armchair, Gift, UserRound, ArrowLeft, Shirt, ArrowRight } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { api, jsonRequest } from "../../lib/client";
import { catalogName, type CatalogItem } from "../../lib/catalog";
import { CUSTOM_GIFT_PREFIX, CUSTOM_GIFT_MAX_LENGTH } from "../../data/items";
import { relationships } from "../../data/relationships";
import type { Participation } from "../../lib/types";

type Profile = Omit<Participation, "diaper" | "gift"> & {
  contact: string;
  relationship: string;
  diaper: string | null;
  gift: string | null;
};
export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [draft, setDraft] = useState<Profile | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]),
    [edit, setEdit] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function load() {
    try {
      const [person, stock] = await Promise.all([
        api<Profile>("/api/profile"),
        api<CatalogItem[]>("/api/catalog"),
      ]);
      setProfile(person);
      setDraft(person);
      setItems(stock);
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    }
    return true;
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setStatus("");
    try {
      await api("/api/profile", { ...jsonRequest(draft), method: "PATCH" });
      setEdit(false);
      if (await load()) setStatus("Seu perfil foi atualizado.");
    } catch (e) {
      setStatus((e as Error).message);
      try {
        setItems(await api<CatalogItem[]>("/api/catalog"));
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  const set = (field: keyof Profile, value: string) =>
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  function choices(kind: CatalogItem["kind"], current: string | null) {
    return items
      .filter((i) => i.kind === kind && (i.active || i.id === current))
      .map((i) => (
        <option
          key={i.id}
          value={i.id}
          disabled={i.id !== current && i.reserved >= i.quantity}
        >
          {i.name}
          {i.id === current
            ? " · sua escolha"
            : i.reserved >= i.quantity
              ? " · esgotado"
              : ""}
        </option>
      ));
  }
  return (
    <main className="shell account-shell">
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <a className="account-back" href="/">
          <ArrowLeft size={16} /> Voltar ao convite
        </a>
        <a className="account-back" href="/jardim">
          <ArrowRight size={16} /> Ir ao Jardim
        </a>
      </div>
      <h1>Meu perfil</h1>
      {status && (
        <p className="notice" role="status">
          {status}
        </p>
      )}
      {!profile || !draft ? (
        <section className="panel-card">
          {status ? (
            <a className="secondary" href="/">
              Abrir convite
            </a>
          ) : (
            <p role="status">Carregando seu perfil…</p>
          )}
        </section>
      ) : (
        <div className="profile-layout">
          <aside className="profile-garden panel-card">
            <div className="profile-portrait">
              {profile.avatar ? (
                <Avatar value={profile.avatar} />
              ) : (
                <UserRound size={46} />
              )}
            </div>
            <h2>{profile.name}</h2>
            <p>{profile.relationship}</p>
            <div className="seat-line">
              <Armchair size={18} />
              {profile.seat ? "Cadeira " + profile.seat : "Ainda sem cadeira"}
            </div>
            <a className="secondary" href="/jardim?acao=personagem">
              <Shirt size={16} />
              {profile.avatar ? "Editar personagem" : "Criar personagem"}
            </a>
            {profile.avatar && (
              <a className="primary" href="/jardim?acao=cadeira">
                {profile.seat ? "Trocar de cadeira" : "Escolher cadeira"}
              </a>
            )}
          </aside>
          <section className="panel-card profile-details">
            <div className="panel-heading">
              <h2>Minha participação</h2>
              {!edit && (
                <button
                  className="text-button"
                  onClick={() => {
                    setDraft(profile);
                    setStatus("");
                    setEdit(true);
                  }}
                >
                  Editar perfil
                </button>
              )}
            </div>
            {edit ? (
              <form onSubmit={save}>
                <label>
                  Nome
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </label>
                <label>
                  Vínculo com Estêvão
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    list="profile-relationships"
                    value={draft.relationship}
                    onChange={(e) => set("relationship", e.target.value)}
                  />
                </label>
                <datalist id="profile-relationships">
                  {relationships.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                <label>
                  Contato <small>apenas a família vê</small>
                  <input
                    maxLength={150}
                    value={draft.contact}
                    onChange={(e) => set("contact", e.target.value)}
                  />
                </label>
                <label>
                  Recado no jardim
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={draft.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </label>
                {profile.diaper && (
                  <fieldset>
                    <legend>Meu presente</legend>
                    <label>
                      Fralda
                      <select
                        value={draft.diaper ?? ""}
                        onChange={(e) => set("diaper", e.target.value)}
                      >
                        {choices("diaper", profile.diaper)}
                      </select>
                    </label>
                    <label>
                      Mimo
                      <select
                        value={
                          draft.gift?.startsWith(CUSTOM_GIFT_PREFIX)
                            ? CUSTOM_GIFT_PREFIX
                            : (draft.gift ?? "")
                        }
                        onChange={(e) => set("gift", e.target.value)}
                      >
                        <option value="">Sem mimo</option>
                        {choices("gift", profile.gift)}
                        <option value={CUSTOM_GIFT_PREFIX}>Outro mimo</option>
                      </select>
                    </label>
                    {draft.gift?.startsWith(CUSTOM_GIFT_PREFIX) && (
                      <label>
                        Qual mimo?
                        <input
                          required
                          maxLength={CUSTOM_GIFT_MAX_LENGTH}
                          value={draft.gift.slice(CUSTOM_GIFT_PREFIX.length)}
                          onChange={(e) =>
                            set("gift", CUSTOM_GIFT_PREFIX + e.target.value)
                          }
                        />
                      </label>
                    )}
                  </fieldset>
                )}
                <div className="panel-buttons">
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => {
                      setEdit(false);
                      setStatus("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button className="primary" disabled={busy}>
                    {busy ? "Salvando…" : "Salvar alterações"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="profile-facts">
                  <dt>Contato privado</dt>
                  <dd>{profile.contact || "Não informado"}</dd>
                  <dt>Recado no jardim</dt>
                  <dd>{profile.message || "Ainda sem recado"}</dd>
                </dl>
                <section className="profile-reservation">
                  <h3>
                    <Gift size={19} /> Meu presente
                  </h3>
                  {profile.diaper ? (
                    <>
                      <strong>{catalogName(items, profile.diaper)}</strong>
                      <p>{catalogName(items, profile.gift)}</p>
                    </>
                  ) : (
                    <p>Você participa como acompanhante da família.</p>
                  )}
                </section>
              </>
            )}
          </section>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await api("/api/auth/session", { method: "DELETE" });
                location.replace("/jardim");
              } catch {
                console.log("Não foi possível sair. Tente novamente.");
              }
            }}
          >
            Sair da conta
          </button>
        </div>
      )}
    </main>
  );
}
