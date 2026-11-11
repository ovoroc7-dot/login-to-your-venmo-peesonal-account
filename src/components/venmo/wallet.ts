/** Venmo balance, its history and pending requests, saved in the user's account so money stays until it is spent or moved out. */

import { DEFAULT_TIPS, type Business, type BusinessProfile } from "./business";

/** "received" is money a friend paid you (for example when they pay your request). */
export type TxKind = "add" | "transfer" | "payment" | "received";

/** Who can see a payment or request, as in Venmo: everyone, friends of both people, or only the two people. */
export type Privacy = "Public" | "Friends" | "Private";

export const PRIVACIES: Privacy[] = ["Public", "Friends", "Private"];

export type Transaction = {
  id: string;
  kind: TxKind;
  /** Amount in cents, always positive. */
  cents: number;
  /** Instant transfer fee (transfers), or the business fee taken from money a business profile receives. */
  fee?: number;
  /** Who was paid / who paid you (payments, received) or which bank (adds and transfers). */
  counterparty: string;
  note?: string;
  /** True when a payment came out of the Venmo balance rather than a bank. */
  fromBalance?: boolean;
  /** True when the money moved because a request was paid ("charged" in Venmo's words). */
  charge?: boolean;
  /** Who can see it (payments and received money only). */
  privacy?: Privacy;
  /** True when a large payment is still on hold (see PENDING_FROM_CENTS). The money has already left the balance. */
  pending?: boolean;
  /** ISO date string. */
  at: string;
};

/** A request still waiting to be paid. Outgoing = you asked a friend; incoming = a friend asked you. */
export type PendingRequest = {
  id: string;
  direction: "outgoing" | "incoming";
  cents: number;
  counterparty: string;
  note: string;
  privacy: Privacy;
  /** ISO date string the request was made. */
  at: string;
  /** Outgoing only: when the friend pays it (ISO). */
  respondAt?: string;
};

/** A balance with its history and requests. The personal account is one; a business profile has its own. */
export type Ledger = {
  balance: number;
  transactions: Transaction[];
  requests: PendingRequest[];
  defaultPrivacy: Privacy;
};

export type Wallet = Ledger & { business?: Business };

export const EMPTY_WALLET: Wallet = { balance: 0, transactions: [], requests: [], defaultPrivacy: "Private" };
export const EMPTY_LEDGER: Ledger = { balance: 0, transactions: [], requests: [], defaultPrivacy: "Public" };

/** How long a friend takes to pay a request you sent them. */
export const FRIEND_PAYS_AFTER_MS = 15_000;

/** The request a friend has already sent you when the app is first opened. */
export const STARTER_REQUESTS: PendingRequest[] = [
  {
    id: "starter-barbara",
    direction: "incoming",
    cents: 1250,
    counterparty: "Barbara Nace",
    note: "Pizza night 🍕",
    privacy: "Friends",
    at: "2026-11-05T19:30:00.000Z",
  },
];

/** Payments you send of this many cents ($1,550.00) or more stay Pending instead of completing. */
export const PENDING_FROM_CENTS = 155_000;

/** True when a payment you send is large enough to be held as Pending. */
export function sendsAsPending(tx: Pick<Transaction, "kind" | "cents">): boolean {
  return tx.kind === "payment" && tx.cents >= PENDING_FROM_CENTS;
}

/** How much a transaction changes the Venmo balance, in cents. */
export function balanceChange(tx: Pick<Transaction, "kind" | "cents" | "fromBalance" | "fee">): number {
  if (tx.kind === "add") return tx.cents;
  if (tx.kind === "received") return tx.cents - (tx.fee ?? 0);
  if (tx.kind === "transfer") return -tx.cents;
  return tx.fromBalance ? -tx.cents : 0;
}

/** True when the balance can pay this transaction (adds always can). */
export function canApply(wallet: Ledger, tx: Pick<Transaction, "kind" | "cents" | "fromBalance" | "fee">): boolean {
  if (!(tx.cents > 0)) return false;
  return wallet.balance + balanceChange(tx) >= 0;
}

/** Adds a transaction to the top of the history and updates the balance. Refused changes leave the wallet as is. */
export function applyTransaction<W extends Ledger>(wallet: W, tx: Transaction): W {
  if (!canApply(wallet, tx)) return wallet;
  const saved: Transaction = sendsAsPending(tx) ? { ...tx, pending: true } : tx;
  return { ...wallet, balance: wallet.balance + balanceChange(tx), transactions: [saved, ...wallet.transactions] };
}

/** True when the Venmo balance covers the full payment. */
export function balanceCovers(cents: number, balance: number): boolean {
  return cents > 0 && cents <= balance;
}

/** Shows up in the Home feed: money that moved between you and a friend (not adds or bank transfers). */
export function inFeed(tx: Transaction): boolean {
  return tx.kind === "payment" || tx.kind === "received";
}

/** Sends a request to a friend. It waits as pending until they pay it or you cancel it. */
export function createRequest<W extends Ledger>(
  wallet: W,
  req: Omit<PendingRequest, "direction" | "respondAt">,
  respondAfterMs = FRIEND_PAYS_AFTER_MS,
): W {
  if (!(req.cents > 0)) return wallet;
  const respondAt = new Date(new Date(req.at).getTime() + respondAfterMs).toISOString();
  return { ...wallet, requests: [{ ...req, direction: "outgoing", respondAt }, ...wallet.requests] };
}

/** Removes a pending request without moving money (cancel your own, or decline a friend's). */
export function removeRequest<W extends Ledger>(wallet: W, id: string): W {
  if (!wallet.requests.some((r) => r.id === id)) return wallet;
  return { ...wallet, requests: wallet.requests.filter((r) => r.id !== id) };
}

/** A friend paid your request: the money lands in your Venmo balance and it moves to Completed. Business profiles pass the fee. */
export function completeOutgoingRequest<W extends Ledger>(wallet: W, id: string, txId: string, at: string, fee = 0): W {
  const req = wallet.requests.find((r) => r.id === id && r.direction === "outgoing");
  if (!req) return wallet;
  const next = applyTransaction(removeRequest(wallet, id), {
    id: txId,
    kind: "received",
    charge: true,
    cents: req.cents,
    ...(fee > 0 ? { fee } : {}),
    counterparty: req.counterparty,
    note: req.note,
    privacy: req.privacy,
    at,
  });
  return next;
}

/** You pay a friend's request, from the Venmo balance (only when it covers it) or from a bank. */
export function payIncomingRequest<W extends Ledger>(
  wallet: W,
  id: string,
  fromBalance: boolean,
  txId: string,
  at: string,
): W {
  const req = wallet.requests.find((r) => r.id === id && r.direction === "incoming");
  if (!req) return wallet;
  if (fromBalance && !balanceCovers(req.cents, wallet.balance)) return wallet;
  return applyTransaction(removeRequest(wallet, id), {
    id: txId,
    kind: "payment",
    charge: true,
    fromBalance,
    cents: req.cents,
    counterparty: req.counterparty,
    note: req.note,
    privacy: req.privacy,
    at,
  });
}

/** Changes who can see one of your payments. */
export function setTransactionPrivacy(wallet: Wallet, id: string, privacy: Privacy): Wallet {
  return {
    ...wallet,
    transactions: wallet.transactions.map((t) => (t.id === id && inFeed(t) ? { ...t, privacy } : t)),
  };
}

/** Settings → Privacy → Past transactions: makes every past payment Friends or Private. */
export function setAllPastPrivacy(wallet: Wallet, privacy: "Friends" | "Private"): Wallet {
  return {
    ...wallet,
    transactions: wallet.transactions.map((t) => {
      if (!inFeed(t)) return t;
      if (privacy === "Friends" && t.privacy !== "Public") return t;
      return { ...t, privacy };
    }),
  };
}

/** Outgoing requests whose friend should have paid by `now`. */
export function dueRequests(wallet: Ledger, now: number): PendingRequest[] {
  return wallet.requests.filter(
    (r) => r.direction === "outgoing" && r.respondAt !== undefined && new Date(r.respondAt).getTime() <= now,
  );
}

const isPrivacy = (v: unknown): v is Privacy => v === "Public" || v === "Friends" || v === "Private";

function isTx(v: unknown): v is Transaction {
  if (!v || typeof v !== "object") return false;
  const t = v as Partial<Record<keyof Transaction, unknown>>;
  return (
    typeof t.id === "string" &&
    (t.kind === "add" || t.kind === "transfer" || t.kind === "payment" || t.kind === "received") &&
    typeof t.cents === "number" &&
    Number.isInteger(t.cents) &&
    t.cents > 0 &&
    typeof t.counterparty === "string" &&
    typeof t.at === "string"
  );
}

function isRequest(v: unknown): v is PendingRequest {
  if (!v || typeof v !== "object") return false;
  const r = v as Partial<Record<keyof PendingRequest, unknown>>;
  return (
    typeof r.id === "string" &&
    (r.direction === "outgoing" || r.direction === "incoming") &&
    typeof r.cents === "number" &&
    Number.isInteger(r.cents) &&
    r.cents > 0 &&
    typeof r.counterparty === "string" &&
    typeof r.note === "string" &&
    isPrivacy(r.privacy) &&
    typeof r.at === "string"
  );
}

type RawLedger = { balance?: unknown; transactions?: unknown; requests?: unknown; defaultPrivacy?: unknown };

function parseLedger(data: RawLedger, starter: PendingRequest[], privacy: Privacy): Ledger {
  const transactions = Array.isArray(data.transactions)
      ? data.transactions.filter(isTx).map((t) => (inFeed(t) && !isPrivacy(t.privacy) ? { ...t, privacy: "Private" as const } : t))
      : [];
    const balance =
      typeof data.balance === "number" && Number.isInteger(data.balance) && data.balance >= 0 ? data.balance : 0;
    const requests = Array.isArray(data.requests) ? data.requests.filter(isRequest) : starter;
    const defaultPrivacy = isPrivacy(data.defaultPrivacy) ? data.defaultPrivacy : privacy;
    return { balance, transactions, requests, defaultPrivacy };
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const path = (v: unknown) => (typeof v === "string" && v ? v : null);

function parseBusiness(v: unknown): Business | undefined {
  if (!v || typeof v !== "object") return undefined;
  const b = v as { profile?: Partial<Record<keyof BusinessProfile, unknown>>; ledger?: RawLedger };
  const p = b.profile;
  if (!p || typeof p.name !== "string" || typeof p.username !== "string" || !p.name || !p.username) return undefined;
  const tips =
    Array.isArray(p.tips) && p.tips.length === 3 && p.tips.every((t) => Number.isInteger(t) && t >= 1 && t <= 100)
      ? (p.tips as number[])
      : DEFAULT_TIPS;
  return {
    profile: {
      name: p.name,
      username: p.username,
      about: str(p.about),
      category: str(p.category),
      subcategory: str(p.subcategory),
      photoPath: path(p.photoPath),
      coverPath: path(p.coverPath),
      contactInstructions: str(p.contactInstructions),
      gallery: Array.isArray(p.gallery) ? p.gallery.filter((g): g is string => typeof g === "string") : [],
      tipsOn: p.tipsOn === true,
      tips,
      createdAt: str(p.createdAt, new Date(0).toISOString()),
    },
    ledger: parseLedger(b.ledger && typeof b.ledger === "object" ? b.ledger : {}, [], "Public"),
  };
}

/** Reads a saved wallet, falling back to a fresh one for missing or damaged data. */
export function parseWallet(raw: string | null): Wallet {
  const fresh: Wallet = { ...EMPTY_WALLET, requests: STARTER_REQUESTS };
  if (!raw) return fresh;
  try {
    const data = JSON.parse(raw) as RawLedger & { business?: unknown };
    const ledger = parseLedger(data, STARTER_REQUESTS, "Private");
    const business = parseBusiness(data.business);
    return business ? { ...ledger, business } : ledger;
  } catch {
    return fresh;
  }
}

export function newTxId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
