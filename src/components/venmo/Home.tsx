import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AddFunds } from "./AddFunds";
import { formatCents, formatMoney } from "./amount";
import illustration from "@/assets/notification-illustration.jpg";
import { BottomNav, type Tab } from "./BottomNav";
import { HomeFeed } from "./HomeFeed";
import { MeScreen, type MeView } from "./MeScreen";
import { SettingsScreen } from "./Settings";
import { PaymentMethods } from "./PaymentMethods";
import { PayRequest } from "./PayRequest";
import { CardsScreen } from "./CardsScreen";
import { CryptoScreen } from "./CryptoScreen";
import { AddMoneySheet } from "./AddMoneySheet";
import { TransferBalance } from "./TransferBalance";
import { SentOverlay } from "./SentOverlay";
import { useWallet } from "./useWallet";
import { Spinner } from "./logos";
import { PayRequestSheet } from "./Transactions";
import { PrivacySheet } from "./PrivacySheet";
import { TransactionReceipt } from "./Receipt";
import { PrivacySettings } from "./PrivacySettings";
import {
  completeOutgoingRequest,
  createRequest,
  dueRequests,
  newTxId,
  payIncomingRequest,
  removeRequest,
  sendsAsPending,
  setAllPastPrivacy,
  setTransactionPrivacy,
  type PendingRequest,
  type Privacy,
  type Transaction,
} from "./wallet";

type Screen = "tabs" | "settings" | "payment" | "pay" | "privacy";

export function Home({ userId, onSignOut }: { userId: string; onSignOut?: () => void }) {
  const [prompt, setPrompt] = useState(true);
  const [tab, setTab] = useState<Tab>("Home");
  const [screen, setScreen] = useState<Screen>("tabs");
  const [cryptoIntro, setCryptoIntro] = useState(true);
  const [overlay, setOverlay] = useState<"addMoney" | "addFunds" | "transfer" | null>(null);
  const [sent, setSent] = useState<{ name: string; pending: boolean } | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const { wallet, record, update, loaded } = useWallet(userId);
  const [meView, setMeView] = useState<MeView>("Wallet");
  const [paying, setPaying] = useState<PendingRequest | null>(null);
  const [editing, setEditing] = useState<{ id: string; privacy: Privacy } | null>(null);
  const balance = wallet.balance;
  const [notice, setNotice] = useState<{ title: string; detail: string } | null>(null);

  useEffect(() => {
    if (notice === null) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Friends pay the requests you send them a short while later; the money lands in your Venmo balance.
  useEffect(() => {
    if (!loaded) return;
    const outgoing = wallet.requests.filter((r) => r.direction === "outgoing" && r.respondAt);
    if (outgoing.length === 0) return;
    const next = Math.min(...outgoing.map((r) => new Date(r.respondAt as string).getTime()));
    const t = setTimeout(() => {
      const due = dueRequests(wallet, Date.now());
      if (due.length === 0) return;
      update((w) =>
        due.reduce((acc, r) => completeOutgoingRequest(acc, r.id, newTxId(), new Date().toISOString()), w),
      );
      const r = due[0];
      if (r) {
        setNotice({
          title: `${r.counterparty} paid your $${formatMoney(r.cents)} request`,
          detail: r.note ? `"${r.note}" · added to your Venmo balance` : "Added to your Venmo balance",
        });
      }
    }, Math.max(0, next - Date.now()));
    return () => clearTimeout(t);
  }, [wallet, loaded, update]);

  const openOverlay = (o: "addMoney" | "transfer") => {
    setNotice(null);
    setOverlay(o);
  };

  const dismiss = (ask: boolean) => {
    if (ask && typeof Notification !== "undefined") {
      Notification.requestPermission().catch(() => {});
    }
    setPrompt(false);
  };

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-subtle">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (screen === "settings") {
    return (
      <SettingsScreen
        onBack={() => setScreen("tabs")}
        onPaymentMethods={() => setScreen("payment")}
        onPrivacy={() => setScreen("privacy")}
        onSignOut={onSignOut}
      />
    );
  }
  if (screen === "privacy") {
    return (
      <PrivacySettings
        defaultPrivacy={wallet.defaultPrivacy}
        onDefault={(p) => update((w) => ({ ...w, defaultPrivacy: p }))}
        onPast={(p) => update((w) => setAllPastPrivacy(w, p))}
        onBack={() => setScreen("settings")}
      />
    );
  }
  if (screen === "payment") {
    return <PaymentMethods onBack={() => setScreen("settings")} />;
  }
  if (screen === "pay") {
    return (
      <PayRequest
        balance={balance}
        defaultPrivacy={wallet.defaultPrivacy}
        onBack={() => setScreen("tabs")}
        onSent={(p, payment) => {
          record({
            kind: "payment",
            cents: payment.cents,
            counterparty: p.name,
            note: payment.note,
            fromBalance: payment.fromBalance,
            privacy: payment.privacy,
          });
          setSent({
            name: p.name.split(" ")[0] ?? p.name,
            pending: sendsAsPending({ kind: "payment", cents: payment.cents }),
          });
          setMeView("Wallet");
          setTab("Me");
          setScreen("tabs");
        }}
        onRequested={(p, req) => {
          update((w) =>
            createRequest(w, {
              id: newTxId(),
              cents: req.cents,
              counterparty: p.name,
              note: req.note,
              privacy: req.privacy,
              at: new Date().toISOString(),
            }),
          );
          setMeView("Transactions");
          setTab("Me");
          setScreen("tabs");
          setNotice({
            title: `You requested $${formatMoney(req.cents)} from ${p.name}`,
            detail: "You'll be notified when they pay",
          });
        }}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-screen animate-fade-soft">
      <div className="min-h-0 flex-1">
        {tab === "Me" && (
          <MeScreen
            onSettings={() => setScreen("settings")}
            onAddMoney={() => openOverlay("addMoney")}
            onTransfer={() => openOverlay("transfer")}
            balance={balance}
            transactions={wallet.transactions}
            requests={wallet.requests}
            view={meView}
            onView={setMeView}
            onCancelRequest={(r) => {
              update((w) => removeRequest(w, r.id));
              setNotice({ title: "Request canceled", detail: `$${formatMoney(r.cents)} request to ${r.counterparty}` });
            }}
            onRemindRequest={(r) =>
              setNotice({ title: "Reminder sent", detail: `We reminded ${r.counterparty} about your request` })
            }
            onDeclineRequest={(r) => {
              update((w) => removeRequest(w, r.id));
              setNotice({ title: "Request declined", detail: `${r.counterparty}'s $${formatMoney(r.cents)} request` });
            }}
            onPayRequest={setPaying}
            onOpenTransaction={setReceipt}
          />
        )}
        {tab === "Cards" && <CardsScreen />}
        {tab === "Crypto" && <CryptoScreen showIntro={cryptoIntro} onIntroDone={() => setCryptoIntro(false)} />}
        {tab === "Home" && (
          <HomeFeed
            transactions={wallet.transactions}
            onEditPrivacy={(id, privacy) => setEditing({ id, privacy })}
            firstSteps={{
              onAddMoney: () => openOverlay("addMoney"),
              onPay: () => setScreen("pay"),
              onAddBank: () => setScreen("payment"),
            }}
          />
        )}
      </div>

      <BottomNav
        tab={tab}
        onTab={(t) => {
          if (t === "Pay/Request") setScreen("pay");
          else {
            if (t === "Me" && tab !== "Me") setMeView("Wallet");
            setTab(t);
          }
        }}
      />

      {overlay === "addMoney" && (
        <AddMoneySheet onClose={() => setOverlay(null)} onFromBank={() => setOverlay("addFunds")} />
      )}
      {overlay === "addFunds" && (
        <AddFunds
          balance={balance}
          onClose={() => setOverlay(null)}
          onAdded={(cents, source) => {
            const next = balance + cents;
            record({ kind: "add", cents, counterparty: source });
            setOverlay(null);
            setTab("Me");
            setNotice({ title: "Money added", detail: `Your Venmo balance is now $${formatCents(next)}` });
          }}
        />
      )}
      {notice !== null && (
        <div
          role="status"
          className="absolute inset-x-4 top-3 z-40 flex items-start gap-3 rounded-lg bg-card px-4 py-3 shadow-lg animate-pop-in"
        >
          <Check className="mt-0.5 h-4 w-4 text-success" strokeWidth={3} />
          <span>
            <span className="block text-sm text-foreground/80">{notice.title}</span>
            <span className="block text-xs text-subtle">{notice.detail}</span>
          </span>
        </div>
      )}
      {overlay === "transfer" && (
        <TransferBalance
          balance={balance}
          onClose={() => setOverlay(null)}
          onTransferred={(cents, info) => record({ kind: "transfer", cents, fee: info.fee, counterparty: info.bank })}
        />
      )}
      {paying && (
        <PayRequestSheet
          req={paying}
          balance={balance}
          onClose={() => setPaying(null)}
          onPay={(fromBalance) => {
            const r = paying;
            update((w) => payIncomingRequest(w, r.id, fromBalance, newTxId(), new Date().toISOString()));
            setPaying(null);
            const held = sendsAsPending({ kind: "payment", cents: r.cents });
            setNotice({
              title: held
                ? `Your $${formatMoney(r.cents)} payment to ${r.counterparty} is pending`
                : `You paid ${r.counterparty} $${formatMoney(r.cents)}`,
              detail: held
                ? "We'll notify you once it's complete"
                : fromBalance
                  ? "Paid from your Venmo balance"
                  : "Paid from your bank",
            });
          }}
        />
      )}
      {editing && (
        <PrivacySheet
          value={editing.privacy}
          defaultPrivacy={wallet.defaultPrivacy}
          onSelect={(p) => update((w) => setTransactionPrivacy(w, editing.id, p))}
          onClose={() => setEditing(null)}
        />
      )}
      {sent && <SentOverlay name={sent.name} pending={sent.pending} onDone={() => setSent(null)} />}
      {receipt && <TransactionReceipt tx={receipt} onClose={() => setReceipt(null)} />}

      {/* notifications prompt */}
      {prompt && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-overlay px-6 animate-fade-soft">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
            className="relative w-full max-w-sm rounded-2xl bg-card px-6 pb-6 pt-8 text-center shadow-2xl animate-pop-in"
          >
            <button
              aria-label="Close"
              onClick={() => dismiss(false)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <img
              src={illustration}
              alt=""
              width={816}
              height={816}
              className="mx-auto h-40 w-40 object-contain mix-blend-multiply"
            />
            <h2 id="notif-title" className="mt-3 text-xl font-semibold leading-tight text-foreground">
              Get automatic updates on your account
            </h2>
            <p className="mt-4 text-sm leading-snug text-muted-foreground">
              We'll let you know when you get a payment or request. We'll also keep you posted on new Venmo
              features or offers.
            </p>
            <p className="mt-4 text-sm leading-snug text-muted-foreground">
              You can change this anytime in Settings.
            </p>
            <button
              onClick={() => dismiss(true)}
              className="mt-6 h-12 w-full rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80"
            >
              Continue
            </button>
            <button onClick={() => dismiss(false)} className="mt-4 text-base font-semibold text-brand">
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
