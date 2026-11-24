"use client";
import { useEffect, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { ParticipationFlow } from "../components/ParticipationFlow";
import { AVATAR_KEY, RECEIPT_KEY, SEAT_KEY } from "../lib/demo";
export default function Home() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [returningGuest, setReturningGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECEIPT_KEY);
      if (saved) {
        setReturningGuest(true);
        setGuestName((JSON.parse(saved) as { name?: string }).name ?? "");
      }
    } catch {}
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <main>
        <nav className="navigation shell">
          <a href="/" className="brand">
            ✿ &nbsp; Chá do estevão
          </a>
          <a href="/familia">Área da família</a>
          <a href="/jardim">Entrar no jardim</a>
        </nav>
        {started ? (
          <ParticipationFlow onClose={() => setStarted(false)} />
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
                    if (returningGuest) setStarted(true);
                    else setStarted(true);
                  }}
                >
                  {returningGuest ? "Ir para o jardim" : "Quero participar"}
                </button>
                {returningGuest && (
                  <button
                    className="text-button letter-secondary-action"
                    onClick={() => {
                      localStorage.removeItem(RECEIPT_KEY);
                      localStorage.removeItem(AVATAR_KEY);
                      localStorage.removeItem(SEAT_KEY);
                      setReturningGuest(false);
                      setGuestName("");
                      setStarted(true);
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
          <span>Chá do estevão</span>
          <span>@ 2026 - Kennedi Rodrigues</span>
        </footer>
      </main>
    </MotionConfig>
  );
}
