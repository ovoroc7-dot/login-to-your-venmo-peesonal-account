import { useState } from "react";
import { User, ChevronDown, Bell, Settings, QrCode, MessageSquare, ChevronRight, Landmark } from "lucide-react";
import city from "@/assets/avatar-city.jpg";
import tyler from "@/assets/avatar-tyler.jpg";
import barbara from "@/assets/avatar-barbara.jpg";
import { AppleGlyph, BofaFlag } from "./logos";
import { Transactions } from "./Transactions";
import { MyPhoto } from "./profilePhoto";
import type { PendingRequest, Transaction } from "./wallet";

const cards = [
  { id: "9269", name: "BANK OF AMERICA, N.A." },
  { id: "0868", name: "BANK OF AMERICA" },
];

export type MeView = "Wallet" | "Transactions";

export function MeScreen({
  onSettings,
  onAddMoney,
  onTransfer,
  balance = 0,
  transactions = [],
  requests = [],
  view = "Wallet",
  onView,
  onCancelRequest,
  onRemindRequest,
  onDeclineRequest,
  onPayRequest,
  onOpenTransaction,
  onEditPhoto,
}: {
  balance?: number;
  transactions?: Transaction[];
  requests?: PendingRequest[];
  view?: MeView;
  onView?: (v: MeView) => void;
  onSettings: () => void;
  onAddMoney?: () => void;
  onTransfer?: () => void;
  onCancelRequest?: (r: PendingRequest) => void;
  onRemindRequest?: (r: PendingRequest) => void;
  onDeclineRequest?: (r: PendingRequest) => void;
  onPayRequest?: (r: PendingRequest) => void;
  onOpenTransaction?: (tx: Transaction) => void;
  onEditPhoto?: () => void;
}) {
  const setView = (v: MeView) => onView?.(v);
  const incoming = requests.filter((r) => r.direction === "incoming").length;
  const [updated] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  );
  return (
    <div className="h-full overflow-y-auto pb-28 animate-fade-soft">
      {/* blue curved header */}
      <div className="relative h-32 rounded-b-[50%_2.75rem] bg-brand px-4 pt-4">
        <div className="flex items-center justify-between">
          <button className="flex h-8 items-center gap-1.5 rounded-full bg-card/90 pl-2.5 pr-2 text-sm font-medium text-brand">
            <User className="h-4 w-4 fill-current" strokeWidth={2} />
            Personal
            <ChevronDown className="h-4 w-4 text-subtle" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-3">
            <button
              aria-label={incoming > 0 ? `Notifications, ${incoming} new` : "Notifications"}
              onClick={() => setView("Transactions")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card text-brand active:opacity-70"
            >
              <Bell className="h-4 w-4 fill-current" strokeWidth={2} />
              {incoming > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-minus px-1 text-[0.6rem] font-bold text-brand-foreground">
                  {incoming}
                </span>
              )}
            </button>
            <button
              aria-label="Settings"
              onClick={onSettings}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-brand active:opacity-70"
            >
              <Settings className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* avatar */}
      <div className="relative -mt-14 flex justify-center">
        <div className="relative">
          <button onClick={onEditPhoto} aria-label="Change profile photo" className="block rounded-full active:opacity-80">
            <MyPhoto className="h-24 w-24" ring="border-4 border-card shadow-sm" />
          </button>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-foreground">
            <QrCode className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>
      </div>

      {/* group / friends */}
      <div className="mt-5 grid grid-cols-2 px-8">
        <button className="flex flex-col items-center gap-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground ring-4 ring-brand/15">
            <MessageSquare className="h-4 w-4 fill-current" strokeWidth={2} />
          </span>
          <span className="text-sm text-brand/80">Create a group</span>
        </button>
        <button className="flex flex-col items-center gap-1.5">
          <span className="flex -space-x-2">
            {[city, tyler, barbara].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                width={512}
                height={512}
                className="h-8 w-8 rounded-full border-2 border-card object-cover"
              />
            ))}
          </span>
          <span className="text-sm text-brand/80">23 friends</span>
        </button>
      </div>

      {/* tabs */}
      <div role="tablist" className="mx-4 mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
        {(["Wallet", "Transactions"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full py-2 transition-colors ${view === v ? "bg-card font-semibold text-foreground shadow-sm" : "font-medium text-muted-foreground"}`}
          >
            {v}
            {v === "Transactions" && requests.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 align-text-top text-[0.6rem] font-bold text-brand-foreground">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === "Transactions" ? (
        <Transactions
          transactions={transactions}
          requests={requests}
          onCancel={onCancelRequest}
          onRemind={onRemindRequest}
          onDecline={onDeclineRequest}
          onPayRequest={onPayRequest}
          onOpen={onOpenTransaction}
        />
      ) : (
      <>

      {/* promo */}
      <div className="mx-4 mt-5 flex items-center gap-3 rounded-2xl bg-promo px-5 py-5 text-brand-foreground shadow-sm">
        <p className="flex-1 text-sm font-semibold leading-snug">
          Earn up to 5% on your favorite brands with Venmo Stash
        </p>
        <button className="rounded-full bg-card/20 px-4 py-2 text-sm font-bold">Let's go!</button>
      </div>

      {/* balance */}
      <section className="mx-4 mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Balance</h3>
          <button className="flex items-center gap-1 text-xs text-subtle">
            Account &amp; Routing <Landmark className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 flex items-start font-display text-foreground">
          <span className="mt-1 text-base">$</span>
          <span data-testid="balance" className="text-4xl leading-none">{Math.floor(balance / 100).toLocaleString("en-US")}</span>
          {balance % 100 !== 0 && (
            <span className="mt-0.5 text-base">{String(balance % 100).padStart(2, "0")}</span>
          )}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onTransfer}
            className="h-9 rounded-full border border-border text-sm font-semibold text-brand/80 active:bg-muted"
          >
            Transfer
          </button>
          <button
            onClick={onAddMoney}
            className="h-9 rounded-full bg-brand text-sm font-bold text-brand-foreground active:opacity-80"
          >
            Add money
          </button>
        </div>
        <button className="mt-4 flex w-full items-center gap-3 text-left">
          <span className="flex h-6 items-center gap-0.5 rounded border border-foreground/70 px-1.5 text-[0.7rem] font-semibold text-foreground">
            <AppleGlyph className="h-3 w-3" />
            Pay
          </span>
          <span className="flex-1 text-xs text-subtle">Pay With Venmo using Apple Pay</span>
          <ChevronRight className="h-4 w-4 text-foreground" strokeWidth={2} />
        </button>
      </section>

      {/* crypto */}
      <section className="mx-4 mt-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h3 className="text-sm font-semibold text-foreground">Crypto</h3>
        <p className="mt-1 flex items-start font-display text-foreground">
          <span className="mt-1 text-base">$</span>
          <span className="text-4xl leading-none">0</span>
        </p>
        <p className="mt-3 text-xs text-subtle">Last update: {updated}*</p>
        <button className="mt-3 h-9 w-full rounded-full border border-border text-sm font-semibold text-brand/80 active:bg-muted">
          View
        </button>
      </section>

      {/* banks and cards */}
      <h3 className="mx-4 mt-6 text-sm font-semibold text-foreground">Banks and cards</h3>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
        {cards.map((c) => (
          <div key={c.id} className="w-32 shrink-0 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
            <div className="flex h-16 items-center justify-center bg-bofa text-brand-foreground">
              <BofaFlag className="h-7 w-12" />
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-[0.7rem] font-semibold text-foreground/80">{c.name}</p>
              <p className="text-[0.7rem] text-subtle">Bank</p>
              <p className="text-[0.7rem] text-subtle">•••• {c.id}</p>
            </div>
          </div>
        ))}
        <button className="flex w-24 shrink-0 items-center text-left text-sm font-semibold leading-snug text-brand active:opacity-60">
          Add a bank or card
        </button>
      </div>
      </>
      )}
    </div>
  );
}
