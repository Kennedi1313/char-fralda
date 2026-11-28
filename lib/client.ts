import { DEMO_MODE, demoApi } from "./demo";

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  if (DEMO_MODE) return demoApi<T>(url, options);
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "Não foi possível concluir. Tente novamente.",
    );
  return result;
}
export const jsonRequest = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Passed only across the immediate client-side navigation, never persisted.
import type { Identity } from "../components/EntryChoice";
let pendingGuest: Identity | null = null;
export function passGuestToGarden(receipt: Identity) { pendingGuest = receipt; }
export function takeGuestForGarden() {
  const guest = pendingGuest;
  pendingGuest = null;
  return guest;
}
