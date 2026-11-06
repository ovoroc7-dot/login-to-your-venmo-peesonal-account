import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, QrCode, Users } from "lucide-react";
import { VenmoMark } from "./logos";
import { Avatar, people, type Person } from "./people";
import { SendMoney, type SentPayment, type SentRequest } from "./SendMoney";
import type { Privacy } from "./wallet";

export function PayRequest({
  onBack,
  onSent,
  onRequested,
  balance = 0,
  defaultPrivacy = "Private",
}: {
  onBack: () => void;
  onSent?: (person: Person, payment: SentPayment) => void;
  onRequested?: (person: Person, request: SentRequest) => void;
  balance?: number;
  defaultPrivacy?: Privacy;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const qLower = q.toLowerCase().replace(/^@/, "");
  const matches = q
    ? people.filter((p) => p.name.toLowerCase().includes(qLower) || p.handle.toLowerCase().includes(qLower))
    : people;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q);
  const isPhone = !isEmail && /^\+?[\d\s().-]{7,}$/.test(q) && q.replace(/\D/g, "").length >= 7;
  const isHandle = !isEmail && !isPhone && q.startsWith("@") && q.length > 1;
  const typedPerson: Person | null = !q
    ? null
    : isEmail
      ? { name: q, handle: "Email" }
      : isPhone
        ? { name: q, handle: "Phone number" }
        : isHandle
          ? { name: q.slice(1), handle: q }
          : { name: q, handle: "Name" };

  useEffect(() => {
    if (person) return;
    const t = setTimeout(() => input.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [person]);

  if (person) {
    return (
      <SendMoney
        person={person}
        onBack={() => setPerson(null)}
        onClose={onBack}
        onSent={onSent}
        onRequested={onRequested}
        balance={balance}
        defaultPrivacy={defaultPrivacy}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-card animate-slide-up">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <button aria-label="Back" onClick={onBack} className="p-2 text-foreground active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3">
          <VenmoMark className="h-4 w-4 shrink-0 text-brand" />
          <input
            ref={input}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !typedPerson) return;
              setPerson(matches[0] && !isEmail && !isPhone ? matches[0] : typedPerson);
            }}
            placeholder="Name, @username, phone, or email"
            aria-label="Name, @username, phone, or email"
            className="min-w-0 flex-1 text-ellipsis bg-transparent text-[0.95rem] text-foreground caret-brand outline-none placeholder:text-subtle/70"
          />
        </label>
        <button aria-label="Scan QR code" className="p-2 text-subtle active:opacity-60">
          <QrCode className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {typedPerson && (
          <ul className="mt-2">
            <li>
              <button
                onClick={() => setPerson(typedPerson)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
              >
                <Avatar person={{ name: typedPerson.name, handle: typedPerson.handle }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] text-foreground/80">{typedPerson.name}</span>
                  <span className="block truncate text-sm text-subtle/80">
                    {isEmail || isPhone ? `Send to ${typedPerson.handle.toLowerCase()}` : `Send to "${q}"`}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        )}

        {!q && (
        <ul className="mt-2 px-4">
          <li className="border-b border-border/70">
            <button className="flex w-full items-center gap-4 py-3.5 text-left active:opacity-70">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-subtle">
                <Users className="h-4 w-4 fill-current" strokeWidth={2} />
              </span>
              <span className="flex-1 text-[0.95rem] text-foreground/80">Sync your contacts</span>
              <ChevronRight className="h-4 w-4 text-subtle" strokeWidth={1.8} />
            </button>
          </li>
          <li>
            <button className="flex w-full items-center gap-4 py-3.5 text-left active:opacity-70">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-subtle">
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                  <circle cx="10" cy="10" r="9" fill="currentColor" />
                  <path d="M10 1v18M1 10h18" stroke="var(--color-muted)" strokeWidth="2" />
                </svg>
              </span>
              <span className="flex-1 text-[0.95rem] text-foreground/80">Select multiple people</span>
              <ChevronRight className="h-4 w-4 text-subtle" strokeWidth={1.8} />
            </button>
          </li>
        </ul>
        )}

        {matches.length > 0 && (
          <h2 className="mt-3 px-4 text-[0.95rem] font-semibold text-foreground/80">
            {q ? "People" : "Top people"}
          </h2>
        )}
        <ul className="mt-2">
          {matches.map((p) => (
            <li key={p.handle}>
              <button
                onClick={() => setPerson(p)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
              >
                <Avatar person={p} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] text-foreground/80">{p.name}</span>
                  <span className="block truncate text-sm text-subtle/80">{p.handle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
