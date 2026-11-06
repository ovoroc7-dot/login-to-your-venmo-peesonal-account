import { Briefcase, CreditCard, Landmark, RotateCw, Wallet, X } from "lucide-react";

const rows = [
  { label: "From bank or debit card", icon: <Landmark className="h-5 w-5" strokeWidth={2.2} /> },
  { label: "Schedule", icon: <Wallet className="h-5 w-5" strokeWidth={2.2} /> },
  { label: "Auto reloads", icon: <RotateCw className="h-5 w-5 -scale-x-100" strokeWidth={2.6} /> },
  { label: "Cash a check", icon: <CreditCard className="h-5 w-5 fill-current" stroke="var(--color-card)" strokeWidth={1.6} /> },
  { label: "Direct Deposit", icon: <Briefcase className="h-5 w-5 fill-current" stroke="var(--color-card)" strokeWidth={1.6} /> },
];

export function AddMoneySheet({ onClose, onFromBank }: { onClose: () => void; onFromBank?: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-scrim animate-fade-soft" onClick={onClose}>
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-card/80" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add money"
        onClick={(e) => e.stopPropagation()}
        className="rounded-t-2xl bg-card pb-8 animate-sheet-up"
      >
        <div className="relative flex h-12 items-center justify-center">
          <h2 className="text-sm text-subtle">Add money</h2>
          <button aria-label="Close" onClick={onClose} className="absolute right-4 text-subtle active:opacity-60">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <ul>
          {rows.map((r) => (
            <li key={r.label}>
              <button
                onClick={r.label === "From bank or debit card" ? onFromBank : undefined}
                className="flex h-14 w-full items-center gap-4 px-4 text-left text-base font-semibold text-foreground/85 active:bg-muted">
                <span className="text-foreground/85">{r.icon}</span>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
