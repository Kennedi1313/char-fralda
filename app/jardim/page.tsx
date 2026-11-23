"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/client";
import { Participation } from "../../lib/types";
import { Garden } from "../../components/Garden";
import { GuestDialog } from "../../components/GuestDialog";

export default function PublicGarden() {
  const [guests, setGuests] = useState<Participation[]>([]);
  const [guest, setGuest] = useState<Participation | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Participation[]>("/api/participations").then(setGuests).catch((e) => setError(e.message)); }, []);
  return <main className="garden-screen immersive-screen public-garden">
    <header className="experience-header">
      <a className="text-button" href="/">Voltar ao convite</a>
      <div><span className="eyebrow">UM JARDIM DE CARINHO</span></div>
      <a className="step-chip" href="/">Quero participar</a>
    </header>
    {error ? <p className="notice">{error}</p> : <Garden guests={guests} onSeat={(_, person) => person && setGuest(person)} immersive />}
    <GuestDialog guest={guest} close={() => setGuest(null)} />
  </main>;
}
