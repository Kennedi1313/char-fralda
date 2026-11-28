"use client";
import { InvitationSheet } from "./InvitationSheet";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { api, jsonRequest } from "../lib/client";
import { DEMO_MODE } from "../lib/demo";
import type { Avatar } from "../lib/types";

export type Identity = {
  id: string;
  token?: string;
  inviteProof?: string;
  name: string;
  family?: boolean;
};
export type GoogleEntry = {
  receipt: Identity;
  registered: boolean;
  avatar: Avatar | null;
  seat: number | null;
};

type GoogleButton = {
  initialize: (settings: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    settings: Record<string, string>,
  ) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleButton } };
  }
}

export function GoogleButtonControl({
  onGoogle,
  claim,
}: {
  onGoogle: (entry: GoogleEntry) => void;
  claim?: Identity;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const button = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sdk = window.google?.accounts.id;
    if (!ready || !sdk || !button.current || !clientId) return;
    let active = true;
    sdk.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!active) return;
        setBusy(true);
        setError("");
        try {
          const entry = await api<GoogleEntry>(
            "/api/auth/google",
            jsonRequest({
              credential,
              claim: claim && { id: claim.id, token: claim.token },
            }),
          );
          if (active) onGoogle(entry);
        } catch (e) {
          if (active) setError((e as Error).message);
        } finally {
          if (active) setBusy(false);
        }
      },
    });
    const host = button.current;
    let lastWidth = 0;
    const render = () => {
      const width = Math.floor(host.clientWidth);
      if (!width || width === lastWidth) return;
      lastWidth = width;
      host.replaceChildren();
      sdk.renderButton(host, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        locale: "pt_BR",
        width: String(width),
      });
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(host);
    return () => {
      observer.disconnect();
      active = false;
    };
  }, [clientId, ready, onGoogle, claim]);
  return (
    <>
      {clientId && !DEMO_MODE ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            onReady={() => setReady(true)}
            onError={() =>
              setError(
                "O Google não carregou. Você pode recarregar a página ou continuar sem conta.",
              )
            }
          />
          <div className="google-action" ref={button} />
          {!ready && !error && (
            <small role="status">Carregando entrada com Google…</small>
          )}
        </>
      ) : (
        <p>
          Entrada com Google indisponível{" "}
          {DEMO_MODE ? "na demonstração" : "no momento"}.
        </p>
      )}
      {busy && <p role="status">Buscando sua participação…</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function EntryChoice({
  onGoogle,
  onGuest,
  onBack,
}: {
  onGoogle: (entry: GoogleEntry) => void;
  onGuest: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");
  async function enterGuest() {
    try {
      if (!DEMO_MODE) await api("/api/auth/session", { method: "DELETE" });
      onGuest();
    } catch {
      setError("Não foi possível iniciar a visita. Tente novamente.");
    }
  }
  return (
    <InvitationSheet onBack={onBack}>
      <div className="sheet-entry">
        <h2>Como você quer participar?</h2>
        <p>
          Com o Google, você pode voltar para editar o personagem e trocar de
          cadeira, inclusive em outro aparelho.
        </p>
        <GoogleButtonControl onGoogle={onGoogle} />
        <button className="text-button guest-action" onClick={enterGuest}>
          Continuar sem conta
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </InvitationSheet>
  );
}
