import type { Transaction } from "./wallet";

/** How Venmo words a payment between you and a friend, e.g. "You paid tyler nace" or "Barbara Nace charged You". */
export function storyParts(tx: Transaction): { actor: string; verb: "paid" | "charged"; target: string; incoming: boolean } {
  const name = tx.counterparty;
  if (tx.kind === "received") {
    return tx.charge
      ? { actor: "You", verb: "charged", target: name, incoming: true }
      : { actor: name, verb: "paid", target: "You", incoming: true };
  }
  return tx.charge
    ? { actor: name, verb: "charged", target: "You", incoming: false }
    : { actor: "You", verb: "paid", target: name, incoming: false };
}

/** Feed-style age: "now", "5m", "3h", "2d", then "Nov 1". */
export function ago(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
