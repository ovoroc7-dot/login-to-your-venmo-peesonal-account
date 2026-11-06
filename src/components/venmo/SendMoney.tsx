import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Gift, X } from "lucide-react";
import { BofaFlag, Spinner, VenmoMark } from "./logos";
import { Avatar, type Person } from "./people";
import { cleanAmount, formatMoney, hasAmount, toCents } from "./amount";
import { balanceCovers, type Privacy } from "./wallet";
import { PrivacyIcon, PrivacySheet } from "./PrivacySheet";
import { GiftScreen } from "./GiftScreen";
import { ScheduleScreen } from "./ScheduleScreen";

type Bank = { id: string; name: string };

const firstBank: Bank = { id: "9269", name: "BANK OF AMERICA, N.A. Personal Checking" };
const banks: Bank[] = [firstBank, { id: "0868", name: "Bank of America Personal Checking" }];

const emojis = ["💵", "🏠", "🥤", "🍕", "☕", "🎁", "🎉", "🚕"];

export type SentPayment = { cents: number; fromBalance: boolean; note: string; privacy: Privacy };
export type SentRequest = { cents: number; note: string; privacy: Privacy };

/** Bank id, or "venmo" to pay from the Venmo balance. */
type Method = string;

export function SendMoney({
  person,
  onBack,
  onClose,
  onSent,
  onRequested,
  balance = 0,
  defaultPrivacy = "Private",
}: {
  person: Person;
  onBack: () => void;
  onClose: () => void;
  onSent?: ((person: Person, payment: SentPayment) => void) | undefined;
  onRequested?: ((person: Person, request: SentRequest) => void) | undefined;
  balance?: number;
  defaultPrivacy?: Privacy;
}) {
  const [step, setStep] = useState<"amount" | "review" | "gift" | "schedule">("amount");
  const [loadingMethod, setLoadingMethod] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (step !== "review") return;
    setBank(balanceCovers(toCents(amount), balance) ? "venmo" : firstBank.id);
    setLoadingMethod(true);
    const t = setTimeout(() => setLoadingMethod(false), 1000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!sending) return;
    const t = setTimeout(() => {
      setSending(false);
      if (mode === "request") onRequested?.(person, { cents: toCents(amount), note, privacy });
      else onSent?.(person, { cents: toCents(amount), fromBalance: bank === "venmo", note, privacy });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);
  const [mode, setMode] = useState<"pay" | "request">("pay");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>(defaultPrivacy);
  const [bank, setBank] = useState<Method>(firstBank.id);
  const [protect, setProtect] = useState(false);
  const [privacySheet, setPrivacySheet] = useState(false);
  const [methods, setMethods] = useState(false);

  if (step === "gift") {
    return <GiftScreen onBack={() => setStep("amount")} onClose={onClose} />;
  }
  if (step === "schedule") {
    return <ScheduleScreen onBack={() => setStep("amount")} />;
  }

  if (step === "amount") {
    return (
      <AmountStep
        onGift={() => setStep("gift")}
        onSchedule={() => setStep("schedule")}
        person={person}
        amount={amount}
        note={note}
        onAmount={setAmount}
        onNote={setNote}
        onBack={onBack}
        onClose={onClose}
        onPay={() => {
          setMode("pay");
          setStep("review");
        }}
        onRequest={() => {
          setMode("request");
          setStep("review");
        }}
      />
    );
  }

  const selected = banks.find((b) => b.id === bank) ?? firstBank;
  const covers = balanceCovers(toCents(amount), balance);
  const useBalance = bank === "venmo" && covers;

  return (
    <div className="relative flex h-full flex-col bg-card animate-fade-soft">
      <Header onBack={() => setStep("amount")} onClose={onClose} />

      <button
        onClick={() => setStep("amount")}
        className="flex flex-col items-center px-6 text-center active:opacity-70"
        aria-label="Edit amount"
      >
        <Avatar person={person} className="h-12 w-12" />
        <span className="mt-2 text-base font-semibold text-foreground/80">{person.name}</span>
        <AmountText value={amount} className="mt-4" />
        {note && <span className="mt-4 max-w-full break-words text-sm text-foreground/80">{note}</span>}
      </button>

      <div className="flex-1" />

      <div className="px-4 pb-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-subtle">Privacy</span>
          <button
            onClick={() => setPrivacySheet(true)}
            className="flex items-center gap-1 text-sm font-semibold text-brand active:opacity-60"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              <PrivacyIcon privacy={privacy} className="h-3.5 w-3.5" />
            </span>
            {privacy}
          </button>
        </div>

        {mode === "pay" && loadingMethod && (
          <>
            <div className="mt-3 flex h-24 w-full flex-col rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm font-bold text-foreground/80">Loading...</span>
              <ChevronRight className="ml-auto mt-auto h-4 w-4 text-subtle" strokeWidth={1.8} />
            </div>
            <div className="flex h-24 items-center justify-center">
              <Spinner className="h-8 w-8 text-brand" />
            </div>
          </>
        )}

        {mode === "pay" && !loadingMethod && (
          <>
        <button
          onClick={() => setMethods(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left active:bg-muted"
        >
          {useBalance ? (
            <>
              <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
                <VenmoMark className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground/80">Venmo balance</span>
                <span className="block text-xs text-subtle/80">Balance: ${formatMoney(balance)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex h-7 w-12 shrink-0 items-center justify-center rounded-md bg-bofa text-brand-foreground">
                <BofaFlag className="h-4 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground/80">{selected.name}</span>
                <span className="block text-xs text-subtle/80">Bank •• {selected.id}</span>
              </span>
            </>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-border" strokeWidth={1.8} />
        </button>

        <div className="mt-2 rounded-xl border border-border px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-foreground/80">Turn on for purchases</span>
            <button
              role="switch"
              aria-checked={protect}
              aria-label="Turn on for purchases"
              onClick={() => setProtect((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
                protect ? "border-brand bg-brand" : "border-border bg-card"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5.5 w-5.5 rounded-full shadow transition-all ${
                  protect ? "left-[1.4rem] bg-card" : "left-0.5 bg-foreground/70"
                }`}
              />
            </button>
          </div>
          <p className="mt-2 text-xs leading-snug text-subtle">
            Get a full refund if an <span className="font-medium text-brand">eligible purchase</span> isn't what you
            paid for. Seller pays a small fee.
          </p>
        </div>

        <button className="mt-3 text-xs font-semibold text-brand active:opacity-60">Terms apply</button>
          </>
        )}

        <button
          onClick={() => {
            if (mode === "request" || !loadingMethod) setSending(true);
          }}
          className="mt-3 h-12 w-full rounded-full bg-go text-base font-bold text-go-foreground shadow-md active:opacity-80"
        >
          {mode === "pay" ? "Pay" : "Request"}
        </button>
      </div>

      {sending && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-scrim px-6 animate-fade-soft">
          <div role="status" className="flex w-full items-center gap-6 bg-card px-5 py-6 shadow-xl animate-pop-in">
            <Spinner className="h-8 w-8 text-brand" />
            <span className="text-sm text-subtle">Sending...</span>
          </div>
        </div>
      )}

      {privacySheet && (
        <PrivacySheet
          value={privacy}
          defaultPrivacy={defaultPrivacy}
          onSelect={setPrivacy}
          onClose={() => setPrivacySheet(false)}
        />
      )}

      {methods && (
        <div className="absolute inset-0 z-30 flex flex-col bg-card animate-slide-up">
          <header className="relative flex h-12 shrink-0 items-center justify-center">
            <button
              aria-label="Close"
              onClick={() => setMethods(false)}
              className="absolute left-2 p-2 text-brand active:opacity-60"
            >
              <X className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-base font-semibold text-foreground/80">Select Payment Method</h1>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <button
              type="button"
              disabled={!covers}
              onClick={() => {
                setBank("venmo");
                setMethods(false);
              }}
              className="mt-6 flex w-full items-center gap-4 text-left active:opacity-70 disabled:opacity-45"
            >
              <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
                <VenmoMark className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] text-foreground/80">Venmo</span>
                <span className="block text-xs text-subtle">Balance: ${formatMoney(balance)}</span>
              </span>
              <span className="flex w-5 justify-end">
                {useBalance && <Check className="h-4 w-4 text-brand" strokeWidth={2.2} />}
              </span>
            </button>
            {!covers && (
              <p className="mt-5 text-xs leading-relaxed text-subtle/70">
                Your Venmo balance can't cover the full amount. Choose a bank or card instead. We'll remember your
                choice and use it next time.
              </p>
            )}

            <h2 className="mt-6 text-xs uppercase text-subtle/70">Banks</h2>
            <ul className="mt-3 space-y-5">
              {banks.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => {
                      setBank(b.id);
                      setMethods(false);
                    }}
                    className="flex w-full items-center gap-4 text-left active:opacity-70"
                  >
                    <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-bofa text-brand-foreground">
                      <BofaFlag className="h-4 w-7" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.95rem] leading-tight text-foreground/80">{b.name}</span>
                      <span className="mt-0.5 block text-xs text-subtle/80">Bank •• {b.id}</span>
                    </span>
                    <span className="text-xs text-subtle/70">No fee</span>
                    <span className="flex w-5 justify-end">
                      {bank === b.id && <Check className="h-4 w-4 text-brand" strokeWidth={2.2} />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button className="mt-10 text-[0.95rem] font-semibold text-brand/80 active:opacity-60">
              Add a bank or card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between px-2">
      <button aria-label="Back" onClick={onBack} className="p-2 text-subtle active:opacity-60">
        <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
      </button>
      <button aria-label="Close" onClick={onClose} className="p-2 text-subtle active:opacity-60">
        <X className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </header>
  );
}

export function AmountText({ value, caret, className = "" }: { value: string; caret?: boolean; className?: string }) {
  return (
    <span className={`flex items-start text-foreground ${className}`}>
      <span className="mt-1.5 text-xl font-medium">$</span>
      <span className="text-[3.25rem] font-normal leading-none tracking-tight">{value || "0"}</span>
      {caret && <span className="ml-0.5 mt-0.5 h-[3.1rem] w-px bg-foreground/60 animate-caret" aria-hidden />}
    </span>
  );
}

function AmountStep({
  person,
  amount,
  note,
  onAmount,
  onNote,
  onBack,
  onClose,
  onPay,
  onRequest,
  onGift,
  onSchedule,
}: {
  onGift: () => void;
  onSchedule: () => void;
  person: Person;
  amount: string;
  note: string;
  onAmount: (v: string) => void;
  onNote: (v: string) => void;
  onBack: () => void;
  onClose: () => void;
  onPay: () => void;
  onRequest: () => void;
}) {
  const amountInput = useRef<HTMLInputElement>(null);
  const noteInput = useRef<HTMLInputElement>(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => amountInput.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const go = (next: () => void) => {
    if (!hasAmount(amount)) {
      amountInput.current?.focus();
      return;
    }
    amountInput.current?.blur();
    noteInput.current?.blur();
    next();
  };
  const pay = () => go(onPay);

  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <Header onBack={onBack} onClose={onClose} />

      <div className="flex flex-col items-center px-6 text-center">
        <span className="relative">
          <Avatar person={person} className="h-12 w-12" />
          <span className="absolute -right-6 top-3 flex h-5 w-5 items-center justify-center rounded-full border border-brand/60 bg-card text-sm leading-none text-brand">
            +
          </span>
        </span>
        <span className="mt-2 text-base font-semibold text-foreground/80">{person.name}</span>

        <label className="relative mt-4 flex items-start">
          <input
            ref={amountInput}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Amount"
            value={amount}
            onChange={(e) => onAmount(cleanAmount(e.target.value))}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && pay()}
            className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
          />
          <AmountText value={amount} caret={amountFocused} />
          <button
            type="button"
            aria-label="Clear amount"
            onClick={() => {
              onAmount("");
              amountInput.current?.focus();
            }}
            className="relative ml-2 mt-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-subtle/45 text-card"
          >
            <X className="h-2.5 w-2.5" strokeWidth={3} />
          </button>
        </label>
      </div>

      <div className="min-h-4 flex-1" />

      <div className="flex flex-col items-end gap-4 px-4" onMouseDown={(ev) => ev.preventDefault()}>
        <button
          onClick={onGift}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 active:opacity-60"
        >
          Gift
          <Gift className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          onClick={onSchedule}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 active:opacity-60"
        >
          Schedule
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
            <rect x="8.5" y="7.5" width="3" height="3" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-4 pt-3">
        <label className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <input
            ref={noteInput}
            value={note}
            onChange={(e) => onNote(e.target.value)}
            onFocus={() => setNoteFocused(true)}
            onBlur={() => setNoteFocused(false)}
            placeholder="What's this for?"
            aria-label="What's this for?"
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-foreground caret-brand outline-none placeholder:text-subtle/70"
          />
          <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand" aria-hidden>
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 10V2a8 8 0 0 1 7.6 5.5Z" fill="currentColor" />
          </svg>
          <span className="flex h-5 shrink-0 items-center rounded border border-brand/70 px-1 text-[0.55rem] font-bold text-brand">
            GIF
          </span>
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2" onMouseDown={(ev) => ev.preventDefault()}>
          <button
            onClick={() => go(onRequest)}
            className="h-11 rounded-full bg-brand text-base font-bold text-brand-foreground shadow-md active:opacity-80"
          >
            Request
          </button>
          <button
            onClick={pay}
            className="h-11 rounded-full bg-brand text-base font-bold text-brand-foreground shadow-md active:opacity-80"
          >
            Pay
          </button>
        </div>

        {noteFocused && (
          <div className="mt-3 flex justify-between overflow-x-auto px-1 animate-fade-soft">
            {emojis.map((e) => (
              <button
                key={e}
                aria-label={`Add ${e}`}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onNote(note + e)}
                className="shrink-0 px-1 text-xl leading-none active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
