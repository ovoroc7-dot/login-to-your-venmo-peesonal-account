import { ArrowDownLeft, ArrowUpRight, ChevronLeft, Clock, Check } from "lucide-react";
import { formatMoney } from "./amount";
import { Avatar, people, type Person } from "./people";
import { PrivacyIcon } from "./PrivacySheet";
import { storyParts } from "./story";
import { balanceChange, type Transaction } from "./wallet";

const personFor = (name: string): Person => people.find((p) => p.name === name) ?? { name, handle: "", kind: "silhouette" };

function fullDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3.5 text-sm">
      <span className="text-subtle">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

/** Activity → tap a transaction: its receipt with amount, status, date, payment method and ID. Covers the bottom bar. */
export function TransactionReceipt({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const social = tx.kind === "payment" || tx.kind === "received";
  const change = balanceChange(tx);
  const incoming = change > 0 || tx.kind === "received";
  const pending = tx.pending === true;
  const s = social ? storyParts(tx) : null;

  const heading = s ? (
    <>
      {s.actor} <span className="font-normal text-subtle">{s.verb}</span> {s.target}
    </>
  ) : tx.kind === "add" ? (
    "Added to Venmo balance"
  ) : (
    "Transfer to bank"
  );

  const method =
    tx.kind === "received"
      ? "Venmo balance"
      : tx.kind === "add"
        ? tx.counterparty
        : tx.kind === "transfer"
          ? "Venmo balance"
          : tx.fromBalance
            ? "Venmo balance"
            : "Bank •• 9269";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="absolute inset-0 z-50 flex flex-col bg-screen animate-fade-soft"
    >
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-border/70 bg-card px-4">
        <button aria-label="Back" onClick={onClose} className="absolute left-2 p-2 text-foreground active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 id="receipt-title" className="text-base font-semibold text-foreground">
          Transaction details
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-10">
        <section className="flex flex-col items-center bg-card px-6 pb-6 pt-7 text-center">
          {social ? (
            <Avatar person={personFor(tx.counterparty)} className="h-16 w-16" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              {tx.kind === "add" ? (
                <ArrowDownLeft className="h-7 w-7" strokeWidth={2.2} />
              ) : (
                <ArrowUpRight className="h-7 w-7" strokeWidth={2.2} />
              )}
            </span>
          )}
          <p className="mt-3 text-base font-semibold text-foreground">{heading}</p>
          {tx.note && <p className="mt-1 text-sm text-foreground/75">{tx.note}</p>}
          <p
            className={`mt-4 text-4xl font-semibold tracking-tight ${
              pending ? "text-pending" : incoming ? "text-success" : "text-foreground"
            }`}
          >
            {incoming ? "+ " : "- "}${formatMoney(tx.cents)}
          </p>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              pending ? "bg-pending/15 text-pending" : "bg-success/12 text-success"
            }`}
          >
            {pending ? <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {pending ? "Pending" : "Completed"}
          </span>
        </section>

        {pending && (
          <div className="mx-4 mt-4 flex gap-3 rounded-xl bg-pending/10 p-4 text-sm leading-snug text-foreground/80">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-pending" strokeWidth={2.2} />
            <p>
              This payment is pending. We're reviewing it to help keep your account secure, and we'll notify you once
              it's complete. {tx.counterparty} won't receive the money until then.
            </p>
          </div>
        )}

        <section className="mx-4 mt-4 rounded-xl bg-card px-4 shadow-sm ring-1 ring-border">
          <Line label="Status">{pending ? "Pending" : "Completed"}</Line>
          <Line label="Date">{fullDate(tx.at)}</Line>
          {tx.kind === "payment" && <Line label="Paid with">{method}</Line>}
          {tx.kind === "received" && <Line label="Added to">{method}</Line>}
          {tx.kind === "add" && <Line label="From">{method}</Line>}
          {tx.kind === "transfer" && <Line label="To">{tx.counterparty}</Line>}
          <Line label="Amount">${formatMoney(tx.cents)}</Line>
          {tx.fee ? <Line label="Instant transfer fee">${formatMoney(tx.fee)}</Line> : null}
          {tx.fee ? <Line label="Total">${formatMoney(tx.cents + tx.fee)}</Line> : null}
          {social && tx.privacy && (
            <Line label="Privacy">
              <span className="inline-flex items-center gap-1">
                <PrivacyIcon privacy={tx.privacy} className="h-3.5 w-3.5" /> {tx.privacy}
              </span>
            </Line>
          )}
          <div className="flex items-start justify-between gap-4 py-3.5 text-sm">
            <span className="text-subtle">Transaction ID</span>
            <span className="break-all text-right font-mono text-xs text-foreground">{tx.id.toUpperCase()}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
