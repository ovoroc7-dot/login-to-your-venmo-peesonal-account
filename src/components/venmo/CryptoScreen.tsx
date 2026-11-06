import { Settings, X } from "lucide-react";
import { ArbitrumMark, EthereumMark, PyusdMark, SolanaMark, StellarMark } from "./crypto-logos";

export function CryptoScreen({ showIntro, onIntroDone }: { showIntro: boolean; onIntroDone: () => void }) {
  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-4 pb-28 pt-6 animate-fade-soft">
        <p className="rounded-xl bg-muted/70 px-3 py-3 text-xs leading-snug text-subtle">
          Avoid crypto scams. Learn more about how to avoid scams in our Security Center.
        </p>

        <div className="mt-5 flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground">Crypto</h1>
          <button
            aria-label="Crypto settings"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-brand shadow-sm ring-1 ring-border"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={2.6} />
          </button>
        </div>
        <p className="mt-2 text-sm text-foreground/80">Your crypto balance</p>
        <p className="mt-1 flex items-start font-display text-foreground">
          <span className="mt-1 text-base">$</span>
          <span className="text-4xl leading-none">0</span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="h-10 rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-sm active:opacity-80">
            Buy
          </button>
          <button className="h-10 rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-sm active:opacity-80">
            Receive
          </button>
        </div>

        <h2 className="mt-6 text-sm text-subtle">PYUSD rewards</h2>
        <section className="mt-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-base font-bold leading-snug text-foreground">
                Get 4%* on
                <br />
                your PYUSD
              </p>
              <p className="mt-1 text-[0.65rem] leading-snug text-subtle">
                Simply buy and hold PYUSD with Venmo. <span className="font-semibold text-brand">Terms apply.</span>{" "}
                *Annual
              </p>
            </div>
            <span className="relative mr-1 mt-1 flex h-16 w-16 items-center justify-center">
              <PyusdMark className="h-10 w-10" />
              <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-mc-orange" />
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-mc-orange" />
              <span className="absolute bottom-2 left-0 h-1.5 w-1.5 rounded-full bg-mc-orange" />
              <span className="absolute bottom-0 right-3 h-2 w-2 rounded-full bg-mc-orange" />
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="h-8 rounded-full bg-brand px-6 text-xs font-bold text-brand-foreground active:opacity-80">
              Opt In
            </button>
            <button className="h-8 rounded-full border border-border px-4 text-xs font-semibold text-brand active:bg-muted">
              Learn More
            </button>
          </div>
        </section>

        <h2 className="mt-6 text-sm text-subtle">Explore more crypto</h2>
        <button className="mt-3 flex w-full items-center gap-3 text-left">
          <PyusdMark className="h-9 w-9" />
          <span className="flex-1 text-sm font-semibold text-foreground">PayPal USD</span>
          <span className="text-sm font-semibold text-foreground">$1</span>
        </button>
      </div>

      {showIntro && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-scrim animate-fade-soft">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pyusd-title"
            className="relative rounded-t-3xl bg-card px-5 pb-8 pt-10 text-center animate-sheet-up"
          >
            <button
              aria-label="Close"
              onClick={onIntroDone}
              className="absolute right-4 top-4 text-subtle active:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
            <PyusdMark className="mx-auto h-11 w-11" />
            <h2 id="pyusd-title" className="mt-4 text-xl leading-tight text-foreground">
              Now you can transfer PYUSD
              <br />
              on Stellar
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-snug text-subtle">
              Leverage flexibility and greater choice to send and receive PYUSD across the Stellar network.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <StellarMark className="h-9 w-9" />
              <ArbitrumMark className="h-9 w-9" />
              <EthereumMark className="h-9 w-9" />
              <SolanaMark className="h-9 w-9" />
            </div>
            <button
              onClick={onIntroDone}
              className="mt-6 h-11 w-full rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80"
            >
              Got it
            </button>
            <button className="mt-4 text-sm font-semibold text-brand">Learn more about crypto networks</button>
          </div>
        </div>
      )}
    </div>
  );
}
