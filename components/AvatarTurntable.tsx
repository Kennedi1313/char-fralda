"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Avatar as Appearance } from "../lib/types";
import { Avatar } from "./Avatar";

const frames = [0, 2, 3, 1];

export function AvatarTurntable({ value }: { value: Appearance }) {
  const [index, setIndex] = useState(0);
  return <div className="avatar-turntable" role="group" aria-label="Girar personagem">
    <button type="button" aria-label="Girar para a esquerda" onClick={() => setIndex(i => (i + 3) % 4)}><ChevronLeft /></button>
    <Avatar value={value} direction={frames[index]} />
    <button type="button" aria-label="Girar para a direita" onClick={() => setIndex(i => (i + 1) % 4)}><ChevronRight /></button>
  </div>;
}
