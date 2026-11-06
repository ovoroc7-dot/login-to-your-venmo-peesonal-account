import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const frequencies = ["Once", "Weekly", "Every 2 weeks", "Monthly"];

export function ScheduleScreen({ onBack }: { onBack: () => void }) {
  const [endDate, setEndDate] = useState(false);

  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-1 p-2 text-subtle active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base text-foreground/80">Schedule</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="mt-3 text-base font-semibold text-foreground/85">Frequency</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 px-1">
          {frequencies.map((f) => (
            <button
              key={f}
              className="h-10 rounded-full border-2 border-foreground/70 text-sm font-semibold text-foreground/85 active:bg-muted"
            >
              {f}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-base font-semibold text-foreground/85">Duration</h2>
        <div className="mt-3 space-y-4" role="radiogroup" aria-label="Duration">
          {[
            { label: "No end date", on: !endDate, set: () => setEndDate(false) },
            { label: "End date", on: endDate, set: () => setEndDate(true) },
          ].map((o) => (
            <button
              key={o.label}
              role="radio"
              aria-checked={o.on}
              onClick={o.set}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                {o.on && <span className="h-5 w-5 rounded-full bg-go" />}
              </span>
              <span className="text-[0.95rem] text-foreground/80">{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-5 pt-3">
        <button
          onClick={onBack}
          className="h-11 w-full rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-md active:opacity-80"
        >
          Save
        </button>
      </div>
    </div>
  );
}
