import { Check, Globe, Users } from "lucide-react";
import type { Privacy } from "./wallet";

export function LockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="8.5" width="12" height="9.5" rx="2" fill="currentColor" />
    </svg>
  );
}

export function PrivacyIcon({ privacy, className = "h-5 w-5" }: { privacy: Privacy; className?: string }) {
  if (privacy === "Public") return <Globe className={className} strokeWidth={2.2} />;
  if (privacy === "Friends") return <Users className={`${className} fill-current`} strokeWidth={2} />;
  return <LockIcon className={className} />;
}

export const privacyOptions: { value: Privacy; body: string }[] = [
  { value: "Public", body: "Visible to everyone on the internet" },
  { value: "Friends", body: "Visible to sender, recipient, and their Venmo friends" },
  { value: "Private", body: "Visible to sender and recipient only" },
];

/** The three Venmo privacy choices with a check on the current one; the default is labelled "(Your Default)". */
export function PrivacyOptions({
  value,
  defaultPrivacy,
  onSelect,
}: {
  value: Privacy;
  defaultPrivacy?: Privacy | undefined;
  onSelect: (p: Privacy) => void;
}) {
  return (
    <ul className="space-y-4">
      {privacyOptions.map((o) => (
        <li key={o.value}>
          <button
            onClick={() => onSelect(o.value)}
            aria-pressed={value === o.value}
            className="flex w-full items-center gap-4 text-left active:opacity-70"
          >
            <span className="flex w-6 justify-center text-brand">
              <PrivacyIcon privacy={o.value} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] text-foreground/80">
                {o.value}
                {defaultPrivacy === o.value ? " (Your Default)" : ""}
              </span>
              <span className="block text-xs leading-snug text-subtle/80">{o.body}</span>
            </span>
            {value === o.value && <Check className="h-5 w-5 text-brand" strokeWidth={2.2} />}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Bottom sheet "Who can see this?" used when paying, requesting, or changing a past payment. */
export function PrivacySheet({
  value,
  defaultPrivacy,
  onSelect,
  onClose,
}: {
  value: Privacy;
  defaultPrivacy?: Privacy | undefined;
  onSelect: (p: Privacy) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-scrim animate-fade-soft">
      <button aria-label="Close" className="flex-1" onClick={onClose} />
      <span className="mx-auto mb-2 h-1 w-12 rounded-full bg-card" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        className="rounded-t-3xl bg-card px-4 pb-10 pt-4 animate-sheet-up"
      >
        <div className="relative flex items-center justify-center">
          <button onClick={onClose} className="absolute left-0 text-sm text-brand/80 active:opacity-60">
            Cancel
          </button>
          <h2 id="privacy-title" className="text-base font-semibold text-foreground/80">
            Who can see this?
          </h2>
        </div>
        <div className="mt-4">
          <PrivacyOptions
            value={value}
            defaultPrivacy={defaultPrivacy}
            onSelect={(p) => {
              onSelect(p);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
