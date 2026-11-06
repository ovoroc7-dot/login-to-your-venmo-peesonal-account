import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, CircleX, Landmark, X, Zap } from "lucide-react";
import { BofaFlag, HuntingtonMark, Spinner } from "./logos";
import {
  canTransfer,
  cleanAmount,
  formatCents,
  formatMoney,
  groupTyped,
  instantFee,
  overTransferLimit,
  standardTransferArrival,
  toCents,
} from "./amount";

type Speed = "instant" | "standard";
type Phase = "form" | "loading" | "error" | "done";
type Bank = { id: string; name: string; kind: "bofa" | "huntington" };

const banks: Bank[] = [
  { id: "6317", name: "BANK OF AMERICA", kind: "bofa" },
  { id: "3351", name: "HUNTINGTON NATIONAL BANK", kind: "huntington" },
];

const disclaimers: Record<Speed, string> = {
  instant:
    "Transfer speed depends on your bank and could take up to 30 minutes. Transfers are reviewed which may result in delays or funds being frozen or removed from your Venmo account.",
  standard:
    "Transfer speeds vary and could take up to 3 business days to complete. Transfers are reviewed which may result in delays or funds being frozen or removed from your Venmo account.",
};

function BankLogo({ bank, size = "sm" }: { bank: Bank; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-9 w-14 rounded-md" : "h-5 w-8 rounded-sm";
  const icon = size === "lg" ? "h-6 w-9" : "h-3.5 w-6";
  return bank.kind === "bofa" ? (
    <span className={`flex shrink-0 items-center justify-center bg-bofa text-brand-foreground ${box}`}>
      <BofaFlag className={icon} />
    </span>
  ) : (
    <span className={`flex shrink-0 items-center justify-center bg-huntington text-brand-foreground ${box}`}>
      <HuntingtonMark className={size === "lg" ? "h-6 w-6" : "h-4 w-4"} />
    </span>
  );
}

/** Transfer Balance: amount → speed → bank → loading → "Transfer Initiated" or "That didn't work...". */
export function TransferBalance({
  balance = 0,
  onClose,
  onTransferred,
}: {
  balance?: number;
  onClose: () => void;
  onTransferred?: (cents: number, info: { fee: number; bank: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState(() => (balance > 0 ? formatCents(balance) : ""));
  const [focused, setFocused] = useState(false);
  const [speed, setSpeed] = useState<Speed>("standard");
  const [bankFor, setBankFor] = useState<Record<Speed, string>>({ instant: "3351", standard: "6317" });
  const [picker, setPicker] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [arrival] = useState(() => standardTransferArrival(new Date()));

  const cents = toCents(amount);
  const fee = speed === "instant" ? instantFee(cents) : 0;
  const net = Math.max(0, cents - fee);
  const ready = canTransfer(cents, balance) && net > 0;
  const tooMuch = cents > balance;
  const bank = banks.find((b) => b.id === bankFor[speed]) ?? banks[0]!;
  const onTransferredRef = useRef(onTransferred);
  onTransferredRef.current = onTransferred;

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => {
      if (overTransferLimit(cents)) {
        setPhase("error");
      } else {
        onTransferredRef.current?.(cents, { fee, bank: `${bank.name} ••${bank.id}` });
        setPhase("done");
      }
    }, 1100);
    return () => clearTimeout(t);
  }, [phase, cents, fee, bank]);

  const submit = () => {
    if (!ready) return;
    input.current?.blur();
    setPhase("loading");
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-scrim pt-10 animate-fade-soft">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-xl bg-card animate-sheet-up"
      >
        <header
          className={`relative flex h-14 shrink-0 items-center justify-center border-b border-border transition-colors ${
            phase === "loading" ? "bg-muted" : ""
          }`}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute left-4 text-brand active:opacity-60"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 id="transfer-title" className="text-base font-medium text-foreground/85">
            Transfer Balance
          </h2>
        </header>

        {phase === "loading" ? (
          <div className="flex flex-1 items-center justify-center text-subtle">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
            {/* amount */}
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center py-6">
              <div className="flex items-start text-foreground">
                <label className="relative flex items-start">
                  <input
                    ref={input}
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    autoComplete="off"
                    aria-label="Transfer amount"
                    value={amount}
                    onChange={(e) => setAmount(cleanAmount(e.target.value))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && input.current?.blur()}
                    className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
                  />
                  <span className="mt-1 text-xl font-medium">$</span>
                  <span className="text-[3.25rem] font-medium leading-none tracking-tight">
                    {groupTyped(amount) || "0"}
                  </span>
                  {focused && (
                    <span className="ml-0.5 mt-0.5 h-[3rem] w-px bg-foreground/60 animate-caret" aria-hidden />
                  )}
                </label>
                <button
                  type="button"
                  aria-label="Clear amount"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setAmount("");
                    input.current?.focus();
                  }}
                  className="ml-2.5 mt-2.5 active:opacity-60"
                >
                  <CircleX className="h-[1.1rem] w-[1.1rem] fill-subtle text-card" strokeWidth={2.4} />
                </button>
              </div>
              <p className={`mt-1 text-xs ${tooMuch ? "text-destructive" : "text-foreground/75"}`}>
                Transfer up to ${formatMoney(balance)}
              </p>
            </div>

            {/* speed */}
            <div className="grid shrink-0 grid-cols-2 gap-3">
              {(["instant", "standard"] as const).map((s) => {
                const on = speed === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSpeed(s)}
                    className={`flex flex-col items-center rounded-md border px-2 pb-3 pt-3 text-center transition-colors ${
                      on ? "border-brand" : "border-subtle/50"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-brand-foreground ${
                        on ? "bg-brand" : "bg-subtle"
                      }`}
                    >
                      {s === "instant" ? (
                        <Zap className="h-5 w-5 fill-current" strokeWidth={1} />
                      ) : (
                        <Landmark className="h-5 w-5" strokeWidth={2.4} />
                      )}
                    </span>
                    <span
                      className={`mt-2 text-sm font-semibold ${on ? "text-foreground/90" : "text-subtle"}`}
                    >
                      {s === "instant" ? "Instant" : "1-3 biz days"}
                    </span>
                    {s === "instant" ? (
                      <span className="mt-1 text-xs text-subtle">In a few minutes</span>
                    ) : (
                      <span className={`mt-1 text-xs leading-snug ${on ? "text-foreground/75" : "text-subtle"}`}>
                        Estimated by
                        <br />
                        {arrival}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {speed === "instant" && (
              <div className="flex shrink-0 items-center justify-between border-b border-border pb-4 pt-6 text-sm">
                <span className="text-foreground/85">Fee</span>
                <span className="text-foreground/70">${formatMoney(fee)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPicker(true)}
              className={`flex shrink-0 items-center gap-2 border-b border-border py-4 text-left active:opacity-70 ${
                speed === "instant" ? "" : "mt-3"
              }`}
            >
              <span className="shrink-0 text-sm text-foreground/85">Transfer to</span>
              <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <BankLogo bank={bank} />
                <span className="truncate text-xs text-foreground/75">
                  {bank.name} ·· {bank.id}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground/60" strokeWidth={2} />
            </button>

            <p className="mt-3 shrink-0 text-[0.68rem] leading-snug text-foreground/70">
              {disclaimers[speed]} <span className="text-brand">Learn more...</span>
            </p>

            <button
              type="button"
              disabled={!ready}
              onClick={submit}
              className={`mb-8 mt-4 h-12 w-full shrink-0 rounded-full text-base font-bold transition-colors ${
                ready ? "bg-go text-go-foreground active:opacity-80" : "bg-muted text-subtle"
              }`}
            >
              Transfer ${formatMoney(net)}
            </button>
          </div>
        )}

        {/* Select Bank */}
        {picker && (
          <div className="absolute inset-0 z-10 flex flex-col bg-scrim pt-3 animate-fade-soft">
            <div className="mx-3 h-2 rounded-t-xl bg-card/70" aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="select-bank-title"
              className="flex flex-1 flex-col rounded-t-xl bg-card animate-sheet-up"
            >
              <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-border">
                <button
                  aria-label="Close bank list"
                  onClick={() => setPicker(false)}
                  className="absolute left-4 text-brand active:opacity-60"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
                <h3 id="select-bank-title" className="text-base font-medium text-foreground/85">
                  Select Bank
                </h3>
              </div>
              <div className="h-10 border-b border-border" />
              <ul>
                {banks.map((b) => (
                  <li key={b.id} className="border-b border-border">
                    <button
                      onClick={() => {
                        setBankFor((m) => ({ ...m, [speed]: b.id }));
                        setPicker(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
                    >
                      <BankLogo bank={b} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base leading-tight text-foreground/85">{b.name}</span>
                        <span className="block text-sm text-subtle">Bank ·· {b.id}</span>
                      </span>
                      {bank.id === b.id && <Check className="h-5 w-5 text-brand" strokeWidth={2} />}
                    </button>
                  </li>
                ))}
              </ul>
              <button className="border-b border-border px-4 py-3 text-left text-base text-brand active:bg-muted">
                Add a bank
              </button>
            </div>
          </div>
        )}

        {/* Result: Transfer Initiated / That didn't work... */}
        {(phase === "done" || phase === "error") && (
          <div
            role="alertdialog"
            aria-labelledby="transfer-result-title"
            className="absolute inset-0 z-20 flex flex-col bg-card animate-sheet-up"
          >
            <div className="flex h-14 shrink-0 items-center px-4">
              <button aria-label="Close" onClick={onClose} className="text-brand active:opacity-60">
                <X className="h-6 w-6" strokeWidth={1.8} />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-10 pb-16 text-center">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-brand-foreground animate-pop-in ${
                  phase === "done" ? "bg-go" : "bg-destructive"
                }`}
              >
                {phase === "done" ? (
                  <Check className="h-6 w-6" strokeWidth={3} />
                ) : (
                  <X className="h-6 w-6" strokeWidth={3} />
                )}
              </span>
              <h3 id="transfer-result-title" className="mt-5 text-lg text-foreground/90">
                {phase === "done" ? "Transfer Initiated" : "That didn\u2019t work..."}
              </h3>
              <p className="mt-3 text-sm leading-snug text-foreground/65">
                {phase === "done"
                  ? "Transfers are reviewed which may result in delays or funds being frozen or removed from your Venmo account."
                  : "The limit for a single bank transfer request is $4999.99, however you can request multiple withdrawals."}
              </p>
            </div>
            {phase === "error" && (
              <button
                onClick={() => setPhase("form")}
                className="h-16 shrink-0 border-t border-border text-base font-medium text-brand active:bg-muted"
              >
                Try Another Amount
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
