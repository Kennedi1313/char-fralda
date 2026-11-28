"use client";
import { useEffect } from "react";
import { DEMO_MODE } from "../lib/demo";
export function DemoBanner() {
  useEffect(() => {
    // Retire receipts and cached profiles left by releases before server sessions.
    for (const storageName of ["localStorage","sessionStorage"] as const) {
      try {
        for (const prefix of ["estevao-", "estevao-demo-"])
          for (const field of ["receipt","avatar","seat"])
            window[storageName].removeItem(prefix+field);
        window[storageName].removeItem("estevao-demo-guests-v1");
      } catch { /* Storage may be disabled. */ }
    }
  }, []);
  if (!DEMO_MODE) return null;
  return (
    <div className="demo-banner">
      <span>Demonstração · dados temporários de exemplo</span>
      <a href="/familia">Ver todas as presenças</a>
      <button
        onClick={() => {
          window.location.assign("/");
        }}
      >
        Recomeçar teste
      </button>
    </div>
  );
}
