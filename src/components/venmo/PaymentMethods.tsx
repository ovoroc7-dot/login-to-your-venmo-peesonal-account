import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Landmark, CreditCard } from "lucide-react";
import { BofaFlag, Spinner, VenmoMark } from "./logos";

const banks = [
  { name: "BANK OF AMERICA, N.A. Personal Checking", last4: "9269" },
  { name: "Bank of America Personal Checking", last4: "0868" },
];

const options = [
  {
    title: "Bank",
    body: "No fee for sending money or online purchases.",
    icon: <Landmark className="h-4 w-4" strokeWidth={2.2} />,
  },
  {
    title: "Debit Card",
    body: "No fee for debit card payments.",
    icon: <CreditCard className="h-4 w-4 fill-current" stroke="var(--color-card)" strokeWidth={1.6} />,
  },
  {
    title: "Credit Card",
    body: "We charge a 3% fee for sending money with credit cards. We don't charge for purchases.",
    icon: <CreditCard className="h-4 w-4" strokeWidth={2.2} />,
  },
  {
    title: "Amex Send® Account",
    body: "No fee for sending money using your Amex credit cards.",
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-brand">
        <span className="h-2.5 w-2 rounded-[1px] bg-card/80" />
      </span>
    ),
  },
];

export function PaymentMethods({ onBack }: { onBack: () => void }) {
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creditCard, setCreditCard] = useState(false);

  const closeSheet = () => {
    setSheet(false);
    setLoading(true);
    setTimeout(() => {
      setCreditCard(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="relative flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-2 p-2 text-subtle active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base font-medium text-muted-foreground">Payment Methods</h1>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center pb-24 text-brand/70">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
      <div className="flex flex-col animate-fade-soft">
      <ul className="mt-2">
        <li className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex h-10 w-14 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <VenmoMark className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] font-semibold text-foreground">Venmo balance (@TrevorNace)</p>
            <p className="text-xs text-subtle">$0.00</p>
          </div>
        </li>
        {creditCard && (
          <li>
            <button className="w-full px-4 py-2.5 text-left active:bg-muted">
              <span className="flex items-center gap-3">
                <span className="relative flex h-10 w-14 items-center justify-center overflow-hidden rounded-md bg-brand text-brand-foreground">
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, transparent 0 5px, color-mix(in oklab, var(--color-card) 55%, transparent) 5px 6.5px)",
                    }}
                  />
                  <VenmoMark className="relative h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] font-semibold text-foreground">Venmo Credit Card</span>
                  <span className="block text-xs text-subtle">Apply now</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-border" strokeWidth={1.8} />
              </span>
              <span className="mt-2 block pr-10 text-xs leading-snug text-subtle">
                Shop, split, and earn cash back rewards* to your Venmo balance.
              </span>
            </button>
          </li>
        )}
        {banks.map((b) => (
          <li key={b.last4}>
            <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted">
              <span className="flex h-10 w-14 items-center justify-center rounded-md bg-bofa text-brand-foreground">
                <BofaFlag className="h-5 w-8" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-semibold text-foreground">{b.name}</p>
                <p className="text-xs text-subtle">Bank •• {b.last4}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-border" strokeWidth={1.8} />
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => setSheet(true)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
          >
            <span className="flex h-10 w-14 items-center justify-center rounded-md border border-border text-brand">
              <Plus className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-[0.95rem] font-semibold text-foreground">Add a bank or card</p>
          </button>
        </li>
      </ul>

      <button className="mt-4 flex items-center px-4 py-3 text-left active:bg-muted">
        <span className="flex-1 text-[0.95rem] font-semibold text-foreground">Preferred in-store payment method</span>
        <ChevronRight className="h-4 w-4 text-border" strokeWidth={1.8} />
      </button>
      </div>
      )}

      {sheet && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-scrim animate-fade-soft">
          <button aria-label="Close" className="flex-1" onClick={closeSheet} />
          <span className="mx-auto mb-2 h-1 w-12 rounded-full bg-card" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            className="relative h-[68%] rounded-t-3xl bg-card px-5 pt-10 animate-sheet-up"
          >
            <button
              aria-label="Close"
              onClick={closeSheet}
              className="absolute right-4 top-4 p-1 text-subtle"
            >
              <X className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <h2 id="add-title" className="text-2xl text-foreground/90">
              Add a bank or card
            </h2>
            <ul className="mt-5 space-y-6">
              {options.map((o) => (
                <li key={o.title}>
                  <button className="flex w-full gap-3 text-left">
                    <span className="mt-0.5 flex w-5 justify-center text-brand">{o.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[0.95rem] font-semibold text-foreground">{o.title}</span>
                      <span className="mt-1 block max-w-[17rem] text-sm leading-snug text-subtle">{o.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
