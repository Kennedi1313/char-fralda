"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Participation } from "../lib/types";
import { AvatarTurntable } from "./AvatarTurntable";
import { catalogName, type CatalogItem } from "../lib/catalog";
export function GuestDialog({
  guest,
  close,
  family = false,
  catalog=[],
}: {
  guest: Participation | null;
  close: () => void;
  family?: boolean;
  catalog?: CatalogItem[];
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
                <AvatarTurntable key={guest.id} value={guest.avatar} />
              )}
              <Dialog.Title>{guest.name}</Dialog.Title>
              {family && guest.relationship && (
                <span className="relationship-badge">
                  {guest.relationship} do Estêvão
                </span>
              )}
              <Dialog.Description>
                {guest.message || "Deixou sua presença com muito carinho."}
              </Dialog.Description>
              {family && (
                <p>
                  {catalogName(catalog,guest.diaper)} · {catalogName(catalog,guest.gift)}
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
