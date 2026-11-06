import { useEffect, useRef, useState } from "react";
import { Check, Landmark, Plus, X, Zap } from "lucide-react";
import { BofaFlag, Spinner } from "./logos";
import { cleanAmount, formatCents, hasAmount, toCents } from "./amount";

type Bank = { id: string; short: string; name: string };

const banks: Bank[] = [
  { id: "9269", short: "BANK OF AMERICA, N.A. Personal Checking", name: "BANK OF AMERICA, N.A." },
  { id: "0868", short: "Bank of America Personal Checking", name: "Bank of America" },
];

const quick = ["10", "25", "50", "100"];

/** Add money to Venmo balance: speed sheet → amount → confirm → done. */
export function AddFunds({
  balance,
  onClose,
  onAdded,
}: {
  balance: number;
  onClose: () => void;
  onAdded: (cents: number, source: string) => void;
}) {
  const [step, setStep] = useState<"speed" | "amount" | "confirm">("speed");

  if (step === "speed") {
    return (
      <div className="absolute inset-0 z-30 flex flex-col justify-end bg-scrim animate-fade-soft" onClick={onClose}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-card/80" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add money for free"
          onClick={(e) => e.stopPropagation()}
          className="rounded-t-2xl bg-card pb-8 animate-sheet-up"
        >
          <div className="relative flex h-12 items-center justify-center">
            <h2 className="text-sm text-subtle">Add money for free</h2>
            <button aria-label="Close" onClick={onClose} className="absolute right-4 text-subtle active:opacity-60">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <button
            onClick={() => setStep("amount")}
            className="flex w-full items-start gap-4 px-4 py-3 text-left active:bg-muted"
          >
            <Zap className="mt-0.5 h-5 w-5 shrink-0 fill-current text-foreground/85" strokeWidth={1.5} />
            <span>
              <span className="block text-base font-semibold text-foreground/85">Instant</span>
              <span className="block text-xs text-subtle">It's free to add up to $500 per week.</span>
            </span>
          </button>
          <button className="flex w-full items-start gap-4 px-4 py-3 text-left active:bg-muted">
            <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-foreground/85" strokeWidth={2.2} />
            <span>
              <span className="block text-base font-semibold text-foreground/85">Standard</span>
              <span className="block text-xs text-subtle">Better for larger amounts. Takes 3-5 days</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return <AmountSheet balance={balance} step={step} setStep={setStep} onClose={onClose} onAdded={onAdded} />;
}

function AmountSheet({
  balance,
  step,
  setStep,
  onClose,
  onAdded,
}: {
  balance: number;
  step: "amount" | "confirm";
  setStep: (s: "amount" | "confirm") => void;
  onClose: () => void;
  onAdded: (cents: number, source: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [focused, setFocused] = useState(false);
  const [working, setWorking] = useState(false);
  const [bank, setBank] = useState(banks[0]!.id);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (step !== "amount") return;
    const t = setTimeout(() => input.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!working) return;
    const t = setTimeout(() => {
      setWorking(false);
      setStep("confirm");
    }, 800);
    return () => clearTimeout(t);
  }, [working, setStep]);

  const next = () => {
    if (!hasAmount(amount)) return;
    input.current?.blur();
    setWorking(true);
  };

  const cents = toCents(amount);
  const shown = step === "confirm" ? formatCents(cents) : amount;
  const selected = banks.find((b) => b.id === bank) ?? banks[0]!;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-scrim pt-6 animate-fade-soft">
      <button aria-label="Close" onClick={onClose} className="absolute inset-x-0 top-0 h-6" />
      <div className="relative flex flex-1 flex-col rounded-t-xl bg-card animate-sheet-up">
        <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />

        <div className="mt-6 flex flex-col items-center px-6 text-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Zap className="h-4 w-4 fill-current" strokeWidth={1.5} />
          </span>

          <label className="relative mt-8 flex items-start">
            {step === "amount" && (
              <input
                ref={input}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label="Amount"
                value={amount}
                onChange={(e) => setAmount(cleanAmount(e.target.value))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
              />
            )}
            <span className="mt-1.5 text-lg font-medium text-foreground">$</span>
            <span className="text-[3rem] font-normal leading-none tracking-tight text-foreground">
              {shown || "0"}
            </span>
            {step === "amount" && focused && (
              <span className="ml-1 mt-0.5 h-[2.9rem] w-px bg-foreground/60 animate-caret" aria-hidden />
            )}
            <button
              type="button"
              aria-label="Clear amount"
              onClick={() => {
                setStep("amount");
                setAmount("");
                setTimeout(() => input.current?.focus(), 50);
              }}
              className="relative ml-2 mt-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-subtle/45 text-card"
            >
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
          </label>
          <p className="mt-2 text-xs text-subtle">Your Venmo balance is ${formatCents(balance)}</p>
        </div>

        {step === "amount" ? (
          <>
            <div className="px-4 pt-14">
              {hasAmount(amount) && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={next}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-md active:opacity-80 animate-fade-soft"
                >
                  {working ? <Spinner className="h-5 w-5" /> : "Next"}
                </button>
              )}
            </div>
            <div className="flex-1" />
            <div
              className="grid grid-cols-4 border-t border-border bg-muted py-2.5"
              onMouseDown={(e) => e.preventDefault()}
            >
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className="text-sm font-semibold text-brand/80 active:opacity-60"
                >
                  ${q}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1" />
            <div className="px-4 pb-5 animate-fade-soft">
              <div className="flex items-center justify-between">
                <span className="text-sm text-subtle">You're adding</span>
                <span className="text-sm font-semibold text-foreground/80">${formatCents(cents)}</span>
              </div>
              <p className="mt-1 text-xs text-subtle/80">This is instantly available for use.</p>
              <div className="mt-4 border-t border-border" />

              <button
                onClick={() => setPicker(true)}
                className="mt-4 flex w-full items-center gap-3 text-left active:opacity-70"
              >
                <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
                  <Landmark className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold uppercase leading-tight text-foreground/75">
                    {selected.short}
                  </span>
                  <span className="block text-xs text-subtle/80">Bank •••• {selected.id}</span>
                </span>
              </button>

              <button
                onClick={() => onAdded(cents, `${selected.name} ••${selected.id}`)}
                className="mt-5 h-11 w-full rounded-full bg-go text-sm font-bold text-go-foreground shadow-md active:opacity-80"
              >
                Add ${formatCents(cents)} now
              </button>
            </div>
          </>
        )}

        {picker && (
          <div
            className="absolute inset-0 z-10 flex flex-col justify-end rounded-t-xl bg-scrim animate-fade-soft"
            onClick={() => setPicker(false)}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-card/80" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Select Bank"
              onClick={(e) => e.stopPropagation()}
              className="rounded-t-2xl bg-card pb-8 animate-sheet-up"
            >
              <div className="relative flex h-12 items-center justify-center">
                <h2 className="text-sm text-subtle">Select Bank</h2>
                <button
                  aria-label="Close"
                  onClick={() => setPicker(false)}
                  className="absolute right-4 text-subtle active:opacity-60"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <ul>
                {banks.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        setBank(b.id);
                        setPicker(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
                    >
                      <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-bofa text-brand-foreground">
                        <BofaFlag className="h-4 w-7" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold uppercase text-foreground/75">
                          {b.short}
                        </span>
                        <span className="block text-xs text-subtle/80">Bank •• {b.id}</span>
                      </span>
                      <span className="flex w-5 justify-end">
                        {bank === b.id && <Check className="h-4 w-4 text-go" strokeWidth={2.6} />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted">
                <span className="flex w-12 justify-center text-brand">
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-sm text-foreground/80">Add a bank</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
