import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, Receipt, X } from "lucide-react";
import { formatMoney } from "./amount";
import { BofaFlag, Spinner, VenmoMark } from "./logos";
import { Avatar, people, type Person } from "./people";
import { PrivacyIcon } from "./PrivacySheet";
import { storyParts } from "./story";
import { balanceChange, balanceCovers, type PendingRequest, type Transaction } from "./wallet";

function when(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

const personFor = (name: string): Person => people.find((p) => p.name === name) ?? { name, handle: "", kind: "silhouette" };

function Row({ tx }: { tx: Transaction }) {
  const change = balanceChange(tx);
  const social = tx.kind === "payment" || tx.kind === "received";
  const person = social ? personFor(tx.counterparty) : undefined;

  let title: React.ReactNode;
  let detail: string;
  if (tx.kind === "add") {
    title = "Added to Venmo balance";
    detail = `From ${tx.counterparty}`;
  } else if (tx.kind === "transfer") {
    title = "Transfer to bank";
    detail = `${tx.counterparty}${tx.fee ? ` · $${formatMoney(tx.fee)} fee` : ""}`;
  } else {
    const s = storyParts(tx);
    title = (
      <>
        {s.actor} <span className="font-normal text-subtle">{s.verb}</span> {s.target}
      </>
    );
    detail = tx.note || (tx.kind === "received" ? "Venmo balance" : tx.fromBalance ? "Venmo balance" : "Bank");
  }

  return (
    <li className="flex items-start gap-3 border-b border-border/70 px-4 py-3.5">
      {person ? (
        <Avatar person={person} className="h-10 w-10" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          {tx.kind === "add" ? (
            <ArrowDownLeft className="h-5 w-5" strokeWidth={2.2} />
          ) : (
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-sm text-foreground/70">{detail}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
          {when(tx.at)}
          {tx.kind === "payment" && !tx.fromBalance ? " · Paid from bank" : ""}
          {social && tx.privacy && (
            <>
              {" · "}
              <PrivacyIcon privacy={tx.privacy} className="h-3 w-3" />
              <span className="sr-only">{tx.privacy}</span>
            </>
          )}
        </span>
      </span>
      <span className={`shrink-0 text-sm font-semibold ${change > 0 ? "text-success" : "text-foreground"}`}>
        {change > 0 || tx.kind === "received" ? "+ " : "- "}${formatMoney(tx.cents)}
      </span>
    </li>
  );
}

function PendingRow({
  req,
  onCancel,
  onRemind,
  onDecline,
  onPay,
}: {
  req: PendingRequest;
  onCancel: () => void;
  onRemind: () => void;
  onDecline: () => void;
  onPay: () => void;
}) {
  const person = personFor(req.counterparty);
  const incoming = req.direction === "incoming";
  return (
    <li className="border-b border-border/70 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Avatar person={person} className="h-10 w-10" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-foreground">
            {incoming ? (
              <>
                <span className="font-semibold">{req.counterparty}</span>{" "}
                <span className="text-subtle">requests</span>{" "}
                <span className="font-semibold">${formatMoney(req.cents)}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">You</span> <span className="text-subtle">requested</span>{" "}
                <span className="font-semibold">${formatMoney(req.cents)}</span>{" "}
                <span className="text-subtle">from</span> <span className="font-semibold">{req.counterparty}</span>
              </>
            )}
          </span>
          {req.note && <span className="block truncate text-sm text-foreground/70">{req.note}</span>}
          <span className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
            {when(req.at)} · <PrivacyIcon privacy={req.privacy} className="h-3 w-3" />
            <span className="sr-only">{req.privacy}</span>
          </span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 pl-[3.25rem]">
        <button
          onClick={incoming ? onDecline : onCancel}
          className="h-8 rounded-full border border-border text-sm font-semibold text-brand/80 active:bg-muted"
        >
          {incoming ? "Decline" : "Cancel"}
        </button>
        <button
          onClick={incoming ? onPay : onRemind}
          className="h-8 rounded-full bg-brand text-sm font-bold text-brand-foreground active:opacity-80"
        >
          {incoming ? "Pay" : "Remind"}
        </button>
      </div>
    </li>
  );
}

/** Confirm paying a friend's request: Venmo balance (when it covers it) or bank. Rendered above the bottom bar. */
export function PayRequestSheet({
  req,
  balance,
  onClose,
  onPay,
}: {
  req: PendingRequest;
  balance: number;
  onClose: () => void;
  onPay: (fromBalance: boolean) => void;
}) {
  const covers = balanceCovers(req.cents, balance);
  const [fromBalance, setFromBalance] = useState(covers);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!sending) return;
    const t = setTimeout(() => onPay(fromBalance), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-scrim animate-fade-soft">
      <button aria-label="Close" className="flex-1" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-req-title"
        className="relative rounded-t-3xl bg-card px-4 pb-8 pt-3 animate-sheet-up"
      >
        <div className="flex justify-end">
          <button aria-label="Close" onClick={onClose} className="p-1 text-subtle active:opacity-60">
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <Avatar person={personFor(req.counterparty)} className="h-12 w-12" />
          <h2 id="pay-req-title" className="mt-2 text-base font-semibold text-foreground/80">
            Pay {req.counterparty}
          </h2>
          <p className="mt-3 flex items-start text-foreground">
            <span className="mt-1 text-lg">$</span>
            <span className="text-5xl leading-none tracking-tight">{formatMoney(req.cents)}</span>
          </p>
          {req.note && <p className="mt-3 text-sm text-foreground/80">{req.note}</p>}
        </div>

        <div className="mt-5 space-y-2">
          <button
            disabled={!covers}
            onClick={() => setFromBalance(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:bg-muted disabled:opacity-45"
          >
            <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
              <VenmoMark className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground/80">Venmo balance</span>
              <span className="block text-xs text-subtle/80">Balance: ${formatMoney(balance)}</span>
            </span>
            {fromBalance && covers && <Check className="h-4 w-4 text-brand" strokeWidth={2.2} />}
          </button>
          <button
            onClick={() => setFromBalance(false)}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:bg-muted"
          >
            <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md bg-bofa text-brand-foreground">
              <BofaFlag className="h-4 w-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-foreground/80">
                BANK OF AMERICA, N.A. Personal Checking
              </span>
              <span className="block text-xs text-subtle/80">Bank •• 9269</span>
            </span>
            {!fromBalance && <Check className="h-4 w-4 text-brand" strokeWidth={2.2} />}
          </button>
          {!covers && (
            <p className="pt-1 text-xs leading-relaxed text-subtle/70">
              Your Venmo balance can't cover the full amount, so your bank will be used.
            </p>
          )}
        </div>

        <button
          onClick={() => setSending(true)}
          className="mt-5 h-12 w-full rounded-full bg-go text-base font-bold text-go-foreground shadow-md active:opacity-80"
        >
          Pay ${formatMoney(req.cents)}
        </button>

        {sending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-3xl bg-scrim px-6 animate-fade-soft">
            <div role="status" className="flex w-full items-center gap-6 bg-card px-5 py-6 shadow-xl animate-pop-in">
              <Spinner className="h-8 w-8 text-brand" />
              <span className="text-sm text-subtle">Sending...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Transactions({
  transactions,
  requests = [],
  onCancel,
  onRemind,
  onDecline,
  onPayRequest,
}: {
  transactions: Transaction[];
  requests?: PendingRequest[];
  onCancel?: ((req: PendingRequest) => void) | undefined;
  onRemind?: ((req: PendingRequest) => void) | undefined;
  onDecline?: ((req: PendingRequest) => void) | undefined;
  onPayRequest?: ((req: PendingRequest) => void) | undefined;
}) {

  if (transactions.length === 0 && requests.length === 0) {
    return (
      <div className="mx-4 mt-10 flex flex-col items-center text-center animate-fade-soft">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-subtle">
          <Receipt className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <p className="mt-4 text-base font-semibold text-foreground">No transactions yet</p>
        <p className="mt-1 text-sm text-subtle">Money you add, send, request, or transfer will show up here.</p>
      </div>
    );
  }
  return (
    <>
      {requests.length > 0 && (
        <section className="mt-4 animate-fade-soft">
          <h3 className="px-4 text-sm font-semibold text-foreground">Pending</h3>
          <ul className="mt-1">
            {requests.map((r) => (
              <PendingRow
                key={r.id}
                req={r}
                onCancel={() => onCancel?.(r)}
                onRemind={() => onRemind?.(r)}
                onDecline={() => onDecline?.(r)}
                onPay={() => onPayRequest?.(r)}
              />
            ))}
          </ul>
        </section>
      )}
      {transactions.length > 0 && (
        <section className="mt-4 animate-fade-soft">
          <h3 className="px-4 text-sm font-semibold text-foreground">Completed</h3>
          <ul className="mt-1">
            {transactions.map((tx) => (
              <Row key={tx.id} tx={tx} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
