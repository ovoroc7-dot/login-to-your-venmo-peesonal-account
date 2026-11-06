import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PrivacyOptions } from "./PrivacySheet";
import type { Privacy } from "./wallet";

/** Settings → Privacy: default privacy for new payments and requests, plus changing all past payments. */
export function PrivacySettings({
  defaultPrivacy,
  onDefault,
  onPast,
  onBack,
}: {
  defaultPrivacy: Privacy;
  onDefault: (p: Privacy) => void;
  onPast: (p: "Friends" | "Private") => void;
  onBack: () => void;
}) {
  const [past, setPast] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="relative flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-2 p-2 text-subtle active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base font-medium text-muted-foreground">Privacy</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <h2 className="pt-4 text-xs uppercase tracking-wide text-subtle">Default privacy settings</h2>
        <p className="mt-1 text-xs leading-snug text-subtle/80">
          This setting will apply to all your future payments and requests. You can always change it for a single
          payment before you send it.
        </p>
        <div className="mt-4">
          <PrivacyOptions value={defaultPrivacy} onSelect={onDefault} />
        </div>

        <h2 className="mt-8 text-xs uppercase tracking-wide text-subtle">More</h2>
        <button
          onClick={() => setPast(true)}
          className="mt-2 flex min-h-12 w-full items-center text-left active:bg-muted"
        >
          <span className="flex-1 text-[0.95rem] text-foreground/80">Past Transactions</span>
          <ChevronRight className="h-4 w-4 text-subtle" strokeWidth={1.8} />
        </button>
        {done && (
          <p role="status" className="mt-2 flex items-center gap-2 text-xs text-success">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> {done}
          </p>
        )}
      </div>

      {past && (
        <div className="absolute inset-0 z-30 flex flex-col bg-card animate-push-in">
          <header className="relative flex h-12 shrink-0 items-center justify-center">
            <button
              aria-label="Back"
              onClick={() => setPast(false)}
              className="absolute left-2 p-2 text-subtle active:opacity-60"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-base font-medium text-muted-foreground">Past Transactions</h1>
          </header>
          <div className="px-4 pt-4">
            <p className="text-sm leading-snug text-foreground/80">
              You can change the privacy of all your past payments to Friends or Private. Payments that are already
              Private stay Private.
            </p>
            {(["Friends", "Private"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  onPast(p);
                  setPast(false);
                  setDone(`All past payments are now ${p === "Friends" ? "Friends or Private" : "Private"}`);
                }}
                className="mt-4 h-12 w-full rounded-full border border-border text-sm font-semibold text-brand active:bg-muted"
              >
                Change All to {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
