import { Check, Clock, Pencil, X } from "lucide-react";

export function SentOverlay({ name, pending = false, onDone }: { name: string; pending?: boolean; onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col animate-fade-soft">
      <div className="absolute inset-0 bg-scrim" aria-hidden />

      <div
        role="status"
        className="relative mx-6 mt-3 flex items-center gap-3 rounded-md bg-card/90 px-4 py-2 text-sm text-foreground/70 shadow animate-pop-in"
      >
        {pending ? (
          <>
            <Clock className="h-5 w-5 shrink-0 text-pending" strokeWidth={2.4} />
            Your payment to {name} is pending
          </>
        ) : (
          <>
            <Check className="h-5 w-5 text-success" strokeWidth={3} />
            You sent a payment to {name}
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="relative rounded-t-2xl bg-card px-6 pb-8 pt-3 animate-sheet-up">
        <div className="flex justify-end">
          <button aria-label="Close" onClick={onDone} className="p-1 text-foreground/80 active:opacity-60">
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>
        <div className="mt-40 space-y-6 blur-[3px]" aria-hidden>
          <span className="block h-3 w-32 rounded bg-muted" />
          <span className="flex items-center justify-between">
            <span className="block h-3 w-40 rounded bg-muted" />
            <Pencil className="h-4 w-4 text-subtle" strokeWidth={2} />
          </span>
        </div>
        <button
          onClick={onDone}
          className="mt-8 h-12 w-full rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80"
        >
          Looks good
        </button>
        <button onClick={onDone} className="mt-6 w-full text-base font-semibold text-brand active:opacity-60">
          Not now
        </button>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-scrim/40 px-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="love-title"
          className="w-full bg-card px-6 pb-4 pt-6 shadow-2xl animate-pop-in"
        >
          <h2 id="love-title" className="text-xl text-foreground/85">
            Love Venmo?
          </h2>
          <p className="mt-2 text-lg leading-none" aria-hidden>
            😍🍩🙈👍😜
          </p>
          <p className="text-lg leading-none" aria-label="5 stars">
            ⭐⭐⭐⭐⭐
          </p>
          <p className="mt-4 text-sm text-foreground/75">Tell others how you feel.</p>
          <div className="mt-4 flex justify-between text-xs font-semibold tracking-wide text-brand">
            <button onClick={onDone} className="py-1 active:opacity-60">
              LATER
            </button>
            <button onClick={onDone} className="py-1 active:opacity-60">
              NO THANKS
            </button>
            <button onClick={onDone} className="py-1 active:opacity-60">
              RATE IT NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
