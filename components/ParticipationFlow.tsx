"use client";
import type { CatalogItem } from "../lib/catalog";
import { Flower2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  api,
  jsonRequest,
  passGuestToGarden,
  takeGuestForGarden,
} from "../lib/client";
import { DEMO_MODE } from "../lib/demo";
import {
  Avatar as AvatarType,
  defaultAvatar,
  Participation,
} from "../lib/types";
import { Avatar } from "./Avatar";
import { InvitationSheet } from "./InvitationSheet";
import { Garden } from "./Garden";
import { GuestDialog } from "./GuestDialog";
import { CharacterCreator } from "./CharacterCreator";
import { ParticipationForm, Registration } from "./ParticipationForm";

import {
  GoogleButtonControl,
  type GoogleEntry,
  type Identity as Receipt,
} from "./EntryChoice";
type Stage = "form" | "invitation" | "character" | "garden";
export function ParticipationFlow({
  onClose,
  startInGarden = false,
  sponsor = null,

  googleEntry = null,
}: {
  onClose: () => void;
  startInGarden?: boolean;
  sponsor?: string | null;

  googleEntry?: GoogleEntry | null;
}) {
  const [stage, setStage] = useState<Stage>(startInGarden ? "garden" : "form");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [catalog,setCatalog] = useState<CatalogItem[]>([]);
  const counts = Object.fromEntries(catalog.map(i=>[i.id,i.reserved]));
  const [guests, setGuests] = useState<Participation[]>([]);
  const [avatar, setAvatar] = useState<AvatarType>(defaultAvatar);
  const [seat, setSeat] = useState<number>();
  const [gardenReady, setGardenReady] = useState(false);
  const [detail, setDetail] = useState<Participation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seated, setSeated] = useState(false);
  const [showSeatSuccess, setShowSeatSuccess] = useState(false);
  const [characterSaved, setCharacterSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const router = useRouter();
  const initialGuest = useRef<Receipt | null>(null);
  const [signedIn, setSignedIn] = useState(!!googleEntry);
  const linked = useCallback((entry: GoogleEntry) => {
    setReceipt(entry.receipt);
    setSignedIn(true);
  }, []);
  useEffect(() => {
    // A page restored from the browser's back/forward cache is a new visit.
    const restore = (e: PageTransitionEvent) => {
      if (e.persisted) location.reload();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  useEffect(() => {
    let active = true;
    if (startInGarden) {
      initialGuest.current ??= takeGuestForGarden();
      Promise.all([
        api<Participation[]>("/api/participations"),
        initialGuest.current || DEMO_MODE
          ? null
          : api<GoogleEntry | null>("/api/auth/session"),
      ])
        .then(([rows, account]) => {
          if (!active) return;
          setGuests(rows);
          const identity = account?.receipt ?? initialGuest.current;
          const own = rows.find((person) => person.id === identity?.id);
          if (identity && own) {
            setReceipt(identity);
            setSignedIn(!!account);
            setSeat(own.seat ?? undefined);
            setSeated(own.seat !== null);
            if (own.avatar) {
              setAvatar(own.avatar);
              setCharacterSaved(true);
            }
          }
          if(account && own){
            const action=new URLSearchParams(location.search).get("acao");
            if(action==="personagem")setStage("character");
            if(action==="cadeira" && own.avatar){setSeated(false);setSeat(undefined);}
            if(action)history.replaceState(history.state,"","/jardim");
          }
          setGardenReady(true);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    } else {
      if (googleEntry) {
        setReceipt(googleEntry.receipt);
        if (googleEntry.registered) {
          if (googleEntry.avatar) router.replace("/jardim");
          else setStage("character");
          return;
        }
      }
      api<CatalogItem[]>("/api/catalog")
        .then(setCatalog)
        .catch((e) => setError(e.message));
    }
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);
  const refreshGarden = async () => {
    const rows = await api<Participation[]>("/api/participations");
    setGuests(rows);
    return rows;
  };
  async function submit(form: Registration) {
    setError("");
    setBusy(true);
    const identity = receipt
      ? { ...receipt, name: form.name, family: sponsor !== null }
      : {
          id: crypto.randomUUID(),
          token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
            n.toString(16).padStart(2, "0"),
          ).join(""),
          name: form.name,
          family: sponsor !== null,
        };
    setReceipt(identity);
    try {
      await api(
        "/api/participations",
        jsonRequest({ ...identity, ...form, sponsor, account: signedIn }),
      );
      setStage(sponsor !== null ? "character" : "invitation");
    } catch (e) {
      setError((e as Error).message);
      api<CatalogItem[]>("/api/catalog")
        .then(setCatalog)
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function enterGarden() {
    setBusy(true);
    try {
      if (stage === "character")
        await api(
          "/api/seats",
          jsonRequest({ ...receipt, avatar, avatarOnly: true }),
        );
      if (startInGarden) {
        await refreshGarden();
        setCharacterSaved(true);
        setStage("garden");
      } else {
        if (!signedIn && receipt) passGuestToGarden(receipt);
        router.push("/jardim");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function shareInvite() {
    if (!receipt) return;
    const digest = async (value: string) =>
      Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(value),
          ),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
    const proof =
      receipt.inviteProof ??
      (receipt.token
        ? await digest("family:" + (await digest(receipt.token)))
        : null);
    if (!proof) return;
    const link = new URL("/", location.origin);
    link.searchParams.set("familia", receipt.id + "." + proof);
    setCopyStatus("");
    setInviteLink(link.href);
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Link copiado!");
    } catch {
      setCopyStatus("Selecione o link acima e copie manualmente.");
    }
  }
  async function saveSeat() {
    setBusy(true);
    setError("");
    try {
      await api("/api/seats", jsonRequest({ ...receipt, seat, avatar }));
      setGuests((current) =>
        current.map((person) =>
          person.id === receipt?.id
            ? { ...person, seat: seat ?? null, avatar }
            : person,
        ),
      );
      setSeated(true);
      setShowSeatSuccess(true);
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
        }}
        onBack={() => {
          setError("");
          if (startInGarden) {
            const saved = guests.find(
              (person) => person.id === receipt?.id,
            )?.avatar;
            if (saved) setAvatar(saved);
            setStage("garden");
          } else setStage("invitation");
        }}
        onContinue={enterGarden}
        busy={busy}
        error={error}
      />
    );
  const canChooseSeat = !!receipt && characterSaved;
  if (stage === "garden")
    return (
      <section
        className="garden-screen immersive-screen"
        aria-label="Escolha seu lugar no jardim"
      >
        <header className="experience-header">
          {canChooseSeat && (signedIn || !seated) ? (
            <button
              className="text-button"
              onClick={() => setStage("character")}
            >
              Editar personagem
            </button>
          ) : (
            <a href="/" className="text-button">
              Voltar ao convite
            </a>
          )}
          <div>
            <span className="eyebrow">SEU CANTINHO NESSA HISTÓRIA</span>
          </div>
          {signedIn && <a className="text-button" href="/perfil">Meu perfil</a>}
          {signedIn && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api("/api/auth/session", { method: "DELETE" });
                  location.replace("/jardim");
                } catch {
                  setError("Não foi possível sair. Tente novamente.");
                }
              }}
            >
              Sair da conta
            </button>
          )}
          {canChooseSeat && !receipt?.family && (
            <button
              id="invite-family-button"
              className="secondary"
              onClick={shareInvite}
            >
              Convidar minha família
            </button>
          )}
        </header>
        <Dialog.Root
          open={!!inviteLink}
          onOpenChange={(open) => {
            if (!open) setInviteLink("");
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="overlay" />
            <Dialog.Content
              className="dialog family-invite-dialog"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                document.getElementById("invite-family-button")?.focus();
              }}
            >
              <Dialog.Close className="close" aria-label="Fechar">
                ×
              </Dialog.Close>
              <Dialog.Title>Convidar minha família</Dialog.Title>
              <Dialog.Description>
                Quem receber este convite pode criar um personagem e escolher
                uma cadeira sem reservar outro presente.
              </Dialog.Description>
              <label>
                Envie este link para sua família
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button className="primary" onClick={copyInvite}>
                Copiar link
              </button>
              <p role="status">{copyStatus}</p>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        {gardenReady && !canChooseSeat && error && <p role="alert">{error}</p>}
        <div className="garden-map-region">
          <Garden
            pending={!gardenReady}
            guests={guests}
            selected={seat}
            previewAvatar={avatar}
            canSelect={canChooseSeat && !seated}
            ownId={receipt?.id}
            immersive
            onRefresh={() => refreshGarden().catch((e) => setError(e.message))}
            onSeat={(number, person) => {
              if (!canChooseSeat) {
                if (person) setDetail(person);
                return;
              }
              if (seated && !person) return;
              if (person && (person.id !== receipt?.id || seated))
                setDetail(person);
              else {
                setSeat(number);
                setSeated(false);
              }
            }}
          />
          {!gardenReady && (
            <div className="garden-loading">
              {error ? (
                <div className="garden-loading-card">
                  <p role="alert">{error}</p>
                  <button
                    className="secondary"
                    onClick={() => location.reload()}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <div className="garden-loading-pill" role="status">
                  <Flower2 size={22} aria-hidden="true" />
                  Carregando os convidados…
                </div>
              )}
            </div>
          )}
        </div>
        {canChooseSeat && (
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
            {seated && !signedIn ? null : seated ? (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setSeat(undefined);
                  setSeated(false);
                }}
              >
                Mudar de cadeira
              </button>
            ) : (
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
        )}
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
              {!signedIn && !DEMO_MODE && receipt && (
                <>
                  <p>
                    Quer poder voltar e mudar seu visual ou sua cadeira? Vincule
                    o Google para guardar este mesmo personagem e presente na
                    sua conta.
                  </p>
                </>
              )}
              {signedIn && <p>Seu lugar está vinculado à sua conta Google.</p>}
              <div className="seat-dialog-actions">
                {!signedIn && !DEMO_MODE && receipt && (
                  <GoogleButtonControl claim={receipt} onGoogle={linked} />
                )}
                <Dialog.Close className="primary">Continuar no jardim</Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </section>
    );
  return (
    <InvitationSheet onBack={onClose}>
      {stage === "form" ? (
        <ParticipationForm
          initialName={googleEntry?.receipt.name ?? ""}
          onSubmit={submit}
          busy={busy}
          error={error}
          family={sponsor !== null}
          catalog={catalog}
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
              {characterSaved || seated
                ? "Ir até o jardim"
                : "Sim, quero criar meu personagem"}
            </button>
          </div>
        </div>
      )}
    </InvitationSheet>
  );
}
