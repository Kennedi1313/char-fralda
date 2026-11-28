"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { ParticipationFlow } from "../components/ParticipationFlow";
import { DEMO_MODE } from "../lib/demo";
import { EntryChoice, type GoogleEntry } from "../components/EntryChoice";
import { api } from "../lib/client";
export default function Home() {
  const pickedIdentity = useRef(false);
  const [choosing, setChoosing] = useState(false);
  const [googleEntry, setGoogleEntry] = useState<GoogleEntry | null>(null);

  const enterGoogle = useCallback((entry: GoogleEntry) => {
    pickedIdentity.current = true;
    setGoogleEntry(entry);
    setChoosing(false);
    setStarted(true);
  }, []);
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [returningGuest, setReturningGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [sponsor, setSponsor] = useState<string | null>(null);
  useEffect(() => {
    const invite = new URLSearchParams(location.search).get("familia");
    if (invite !== null) {
      setSponsor(invite);

      setChoosing(true);
      return;
    }
    if (!DEMO_MODE)
      api<GoogleEntry | null>("/api/auth/session")
        .then((entry) => {
          if (!entry || pickedIdentity.current) return;
          setGoogleEntry(entry);
          setReturningGuest(entry.registered);
          setGuestName(entry.receipt.name);
        })
        .catch(() => {});
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <main>
        <nav className="navigation shell">
          <a href="/" className="brand">
            ✿ &nbsp; Chá do Estêvão
          </a>
          {returningGuest && <a href="/perfil">Meu perfil</a>}
          <a href="/familia">Área da família</a>
          <a href="/jardim">Entrar no jardim</a>
        </nav>
        {choosing ? (
          <EntryChoice
            onGoogle={enterGoogle}
            onGuest={() => {
              pickedIdentity.current = true;
              setGoogleEntry(null);
              setChoosing(false);
              setStarted(true);
            }}
            onBack={() => location.assign("/")}
          />
        ) : started ? (
          <ParticipationFlow
            onClose={() => location.assign("/")}
            googleEntry={googleEntry}
            sponsor={sponsor}
          />
        ) : (
          <section className="invitation">
            <div className="botanical botanical-left">❧</div>
            <div className="botanical botanical-right">❧</div>
            <p className="eyebrow">UMA CARTINHA CHEIA DE CARINHO</p>
            <h1>
              Para você, que já faz
              <br />
              parte da nossa história.
            </h1>
            <div className={`envelope ${open ? "is-open" : ""}`}>
              <motion.div
                className="envelope-flap"
                animate={{ rotateX: open ? 180 : 0 }}
                transition={{ duration: 0.7 }}
              />
              <motion.article
                className="letter"
                initial={false}
                animate={{
                  y: open ? -80 : 0,
                  opacity: open ? 1 : 0,
                  scale: open ? 1 : 0.85,
                }}
                transition={{ delay: open ? 0.35 : 0, duration: 0.7 }}
                aria-hidden={!open}
              >
                {open && (
                  <button
                    className="letter-close"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar carta"
                  >
                    ×
                  </button>
                )}
                <span className="letter-flower">✿</span>
                {returningGuest ? (
                  <>
                    <p className="eyebrow">UM AGRADECIMENTO COM CARINHO</p>
                    <h2>
                      Obrigada,
                      <br />
                      {guestName}!
                    </h2>
                    <p>
                      Seu carinho já está guardado.
                      <br />
                      Venha visitar o nosso jardim.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">VOCÊ É NOSSO CONVIDADO</p>
                    <h2>
                      Chá de fraldas do
                      <br />
                      <em>Estêvão</em>
                    </h2>
                    <p>
                      Nosso mundo está prestes a florescer.
                      <br />E queremos seu carinho,
                      <br />
                      mesmo que seja de longe.
                    </p>
                  </>
                )}
                <p>
                  <br />
                </p>
                <button
                  className="primary"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    if (returningGuest && googleEntry?.avatar)
                      location.assign("/jardim");
                    else if (returningGuest) setStarted(true);
                    else setChoosing(true);
                  }}
                >
                  {returningGuest ? "Ir para o jardim" : "Quero participar"}
                </button>
                {returningGuest && (
                  <button
                    className="text-button letter-secondary-action"
                    onClick={() => {
                      setReturningGuest(false);
                      setGuestName("");
                      setChoosing(true);
                    }}
                  >
                    Continuar como outra pessoa
                  </button>
                )}
                <small>Com amor, Amanda e Kennedi</small>
              </motion.article>
              <div className="envelope-front" />
              {!open && (
                <button
                  className="wax-seal"
                  onClick={() => setOpen(true)}
                  aria-label="Abrir o convite"
                >
                  E
                </button>
              )}
            </div>
            <p className="open-hint">
              {!open && "Toque no selo para abrir o convite"}
            </p>
            <div className="invitation-footer">
              FEITO DE AFETO &nbsp; · &nbsp; GUARDADO PARA SEMPRE
            </div>
          </section>
        )}
        <footer className="shell">
          <span>Chá do Estêvão</span>
          <span>@ 2026 - Kennedi Rodrigues</span>
        </footer>
      </main>
    </MotionConfig>
  );
}
