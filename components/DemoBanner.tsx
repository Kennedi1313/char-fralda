"use client";
import { AVATAR_KEY, DEMO_KEY, DEMO_MODE, RECEIPT_KEY, SEAT_KEY } from "../lib/demo";
export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="demo-banner">
      <span>Demonstração · atualize a página para recomeçar, sem salvar estado</span>
      <a href="/familia">Ver todas as presenças</a>
      <button
        onClick={() => {
          localStorage.removeItem(DEMO_KEY);
          localStorage.removeItem(RECEIPT_KEY);
          localStorage.removeItem(AVATAR_KEY);
          localStorage.removeItem(SEAT_KEY);
          window.location.assign("/");
        }}
      >
        Recomeçar teste
      </button>
    </div>
  );
}
