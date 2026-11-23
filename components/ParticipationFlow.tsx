"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { api, jsonRequest } from "../lib/client";
import { AVATAR_KEY, DEMO_MODE, RECEIPT_KEY, SEAT_KEY } from "../lib/demo";
import {
  Avatar as AvatarType,
  defaultAvatar,
  Participation,
} from "../lib/types";
import { Avatar } from "./Avatar";
import { Garden } from "./Garden";
import { GuestDialog } from "./GuestDialog";
import { CharacterCreator } from "./CharacterCreator";
import { ParticipationForm, Registration } from "./ParticipationForm";

type Receipt = { id: string; token: string; name: string };
type Stage = "form" | "invitation" | "character" | "garden";
export function ParticipationFlow({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("form");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [guests, setGuests] = useState<Participation[]>([]);
  const [avatar, setAvatar] = useState<AvatarType>(defaultAvatar);
  const [seat, setSeat] = useState<number>();
  const [detail, setDetail] = useState<Participation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seated, setSeated] = useState(false);
  const [showSeatSuccess, setShowSeatSuccess] = useState(false);
  const [characterSaved, setCharacterSaved] = useState(false);
  useEffect(() => {
    try {
      const saved = DEMO_MODE ? null : localStorage.getItem(RECEIPT_KEY);
      if (saved) {
        setReceipt(JSON.parse(saved));
        setStage("invitation");
      }
      const savedAvatar = localStorage.getItem(AVATAR_KEY);
      if (savedAvatar) {
        setAvatar(JSON.parse(savedAvatar));
        setCharacterSaved(true);
      }
      const savedSeat = localStorage.getItem(SEAT_KEY);
      if (savedSeat) { setSeat(Number(savedSeat)); setSeated(true); }
    } catch {}
    api<Record<string, number>>("/api/availability")
      .then(setCounts)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);
  const refreshGarden = async () =>
    setGuests(await api<Participation[]>("/api/participations"));
  async function submit(form: Registration) {
    setError("");
    setBusy(true);
    const identity = receipt ?? {
      id: crypto.randomUUID(),
      token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join(""),
      name: form.name,
    };
    setReceipt(identity);
    try {
      await api("/api/participations", jsonRequest({ ...form, ...identity }));
      try {
        if (!DEMO_MODE)
          localStorage.setItem(RECEIPT_KEY, JSON.stringify(identity));
      } catch {}
      setStage("invitation");
    } catch (e) {
      setError((e as Error).message);
      api<Record<string, number>>("/api/availability")
        .then(setCounts)
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function enterGarden() {
    setBusy(true);
    setError("");
    try {
      await refreshGarden();
      setStage("garden");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveSeat() {
    setBusy(true);
    setError("");
    try {
      await api("/api/seats", jsonRequest({ ...receipt, seat, avatar }));
      setSeated(true);
      setShowSeatSuccess(true);
      try { localStorage.setItem(SEAT_KEY, String(seat)); } catch {}
      await refreshGarden();
    } catch (e) {
      setError((e as Error).message);
      await refreshGarden().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  if (stage === "character")
    return (
      <CharacterCreator
        value={avatar}
        onChange={(value) => {
          setAvatar(value);
          setSeated(false);
          setCharacterSaved(true);
          try { localStorage.setItem(AVATAR_KEY, JSON.stringify(value)); } catch {}
        }}
        onBack={() => {
          setError("");
          setStage("invitation");
        }}
        onContinue={enterGarden}
        busy={busy}
        error={error}
      />
    );
  if (stage === "garden")
    return (
      <section
        className="garden-screen immersive-screen"
        aria-label="Escolha seu lugar no jardim"
      >
        <header className="experience-header">
          <button className="text-button" onClick={() => setStage("character")}>
            Editar personagem
          </button>
          <div>
            <span className="eyebrow">SEU CANTINHO NESSA HISTÓRIA</span>
          </div>
          <span className="step-chip">02 · Nosso jardim</span>
        </header>
        <Garden
          guests={guests}
          selected={seat}
          previewAvatar={avatar}
          ownId={receipt?.id}
          immersive
          onRefresh={() => refreshGarden().catch((e) => setError(e.message))}
          onSeat={(number, person) => {
            if (person && (person.id !== receipt?.id || seated)) setDetail(person);
            else {
              setSeat(number);
              setSeated(false);
            }
          }}
        />
        <footer className="experience-footer">
          <div className="seat-confirmation">
            <Avatar value={avatar} />
            <div>
              <strong>
                {receipt?.name}
                {seat ? ` · Cadeira ${seat}` : ""}
              </strong>
              <small>
                {error ||
                  (seated
                    ? DEMO_MODE
                      ? "Lugar confirmado nesta demonstração."
                      : "Seu bonequinho fica aqui mesmo depois de você sair."
                    : "Escolha uma cadeira livre; você verá uma prévia antes de confirmar.")}
              </small>
            </div>
          </div>
          {!seated && (
            <button
              className="primary"
              disabled={!seat || busy}
              onClick={saveSeat}
            >
              {busy
                ? "Guardando…"
                : seat
                  ? `Confirmar cadeira ${seat}`
                  : "Escolha uma cadeira"}
            </button>
          )}
        </footer>
        <GuestDialog guest={detail} close={() => setDetail(null)} />
        <Dialog.Root open={showSeatSuccess} onOpenChange={setShowSeatSuccess}>
          <Dialog.Portal>
            <Dialog.Overlay className="overlay" />
            <Dialog.Content className="dialog">
              <Dialog.Close className="close" aria-label="Fechar">
                ×
              </Dialog.Close>
              <Dialog.Title>Você já está sentado no jardim!</Dialog.Title>
              <Dialog.Description>
                {DEMO_MODE
                  ? "Sua presença está confirmada nesta demonstração. No site publicado, todos poderão ver você no jardim."
                  : "Sua presença está confirmada e agora todos podem ver você no jardim."}
              </Dialog.Description>
              <Dialog.Close className="primary">
                Continuar no jardim
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
    );
  return (
    <section className="flow shell registration-flow">
      <button className="text-button" onClick={onClose}>
        Voltar ao convite
      </button>
      {stage === "form" ? (
        <ParticipationForm
          onSubmit={submit}
          busy={busy}
          error={error}
          counts={counts}
        />
      ) : (
        <div className="confirmation">
          <span className="letter-flower">✿</span>
          <p className="eyebrow">SEU CARINHO JÁ CHEGOU</p>
          <h2>
            Obrigada,
            <br />
            {receipt?.name}!
          </h2>
          <div className="garden-invite">
            <h3>Quer deixar um pedacinho de você no jardim?</h3>
            <p>
              Primeiro, crie seu personagem do seu jeitinho. Depois, escolha uma
              cadeira no nosso jardim encantado.
            </p>
            <button
              className="primary"
              onClick={() => {
                setError("");
                if (characterSaved || seated) enterGarden();
                else setStage("character");
              }}
            >
              {characterSaved || seated ? "Ir até o jardim" : "Sim, quero criar meu personagem"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
