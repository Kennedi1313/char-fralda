"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Participation } from "../lib/types";
import { Avatar } from "./Avatar";
import { itemName } from "../data/items";
export function GuestDialog({
  guest,
  close,
  family = false,
}: {
  guest: Participation | null;
  close: () => void;
  family?: boolean;
}) {
  return (
    <Dialog.Root open={!!guest} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog">
          {guest && (
            <>
              <Dialog.Close className="close" aria-label="Fechar">
                ×
              </Dialog.Close>
              {guest.avatar && (
                <GuestAvatar key={guest.id} avatar={guest.avatar} />
              )}
              <Dialog.Title>{guest.name}</Dialog.Title>
              {family && guest.relationship && (
                <span className="relationship-badge">
                  {guest.relationship} do Estevão
                </span>
              )}
              <Dialog.Description>
                {guest.message || "Deixou sua presença com muito carinho."}
              </Dialog.Description>
              {family && (
                <p>
                  {itemName(guest.diaper)} · {itemName(guest.gift)}
                  <br />
                  {guest.contact}
                </p>
              )}
              <small>
                {guest.seat
                  ? `Cadeira ${guest.seat}`
                  : "Participou sem cadeira no jardim"}
              </small>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GuestAvatar({
  avatar,
}: {
  avatar: NonNullable<Participation["avatar"]>;
}) {
  const [direction, setDirection] = useState(0);
  return (
    <>
      <Avatar value={avatar} direction={direction} />
      <div className="turn-controls" role="group" aria-label="Girar personagem">
        {["Frente", "Esquerda", "Direita", "Costas"].map((label, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={direction === index}
            onClick={() => setDirection(index)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
