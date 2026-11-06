import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  Landmark,
  WalletMinimal,
  MapPin,
  ScanFace,
  Lock,
  Bell,
  Smile,
  Files,
  IdCard,
  RotateCcw,
  BriefcaseBusiness,
  Banknote,
  CreditCard,
  Send,
  CircleDollarSign,
  Smartphone,
  Star,
  LogIn,
} from "lucide-react";
import { VenmoMark } from "./logos";

type Row = { label: string; icon: React.ReactNode; badge?: boolean; value?: string; onClick?: (() => void) | undefined };

const ic = "h-5 w-5";

export function SettingsScreen({
  onBack,
  onPaymentMethods,
  onSignOut,
  onPrivacy,
}: {
  onBack: () => void;
  onPaymentMethods: () => void;
  onPrivacy?: (() => void) | undefined;
  onSignOut?: (() => void) | undefined;
}) {
  const [signingOut, setSigningOut] = useState(false);

  const preferences: Row[] = [
    { label: "Account", icon: <User className={`${ic} fill-current`} /> },
    { label: "Create Business Profile", icon: <Plus className={ic} strokeWidth={1.8} />, badge: true },
    { label: "Payment Methods", icon: <Landmark className={ic} />, onClick: onPaymentMethods },
    { label: "Scheduled Payments & Requests", icon: <WalletMinimal className={ic} /> },
    {
      label: "Shipping Addresses",
      icon: <MapPin className={`${ic} fill-current`} stroke="var(--color-card)" strokeWidth={1.6} />,
    },
    { label: "Face ID & Passcode", icon: <ScanFace className={ic} /> },
    { label: "Privacy", icon: <Lock className={`${ic} fill-current`} />, onClick: onPrivacy },
    { label: "Notifications", icon: <Bell className={`${ic} fill-current`} /> },
    { label: "Emoji", icon: <Smile className={ic} strokeWidth={1.6} /> },
    { label: "Get help", icon: <span className="text-xl font-bold leading-none">?</span> },
  ];
  const tax: Row[] = [
    { label: "Tax Verification", icon: <IdCard className={ic} /> },
    { label: "Tax Documents", icon: <Files className={ic} /> },
  ];
  const buying: Row[] = [
    {
      label: "Venmo Debit Card",
      icon: (
        <span className="flex h-5 w-4 items-center justify-center rounded-[3px] bg-current">
          <VenmoMark className="h-2.5 w-2.5 text-card" title="" />
        </span>
      ),
    },
    { label: "Auto Reload", icon: <RotateCcw className={ic} strokeWidth={2.4} /> },
    { label: "Direct Deposit", icon: <BriefcaseBusiness className={`${ic} fill-current`} stroke="var(--color-card)" /> },
    { label: "Cash a Check", icon: <Banknote className={ic} /> },
    { label: "Backup Payment", icon: <CreditCard className={ic} /> },
    { label: "Connected Businesses", icon: <Files className={ic} /> },
    { label: "Send & receive money with Visa+", icon: <Send className={`${ic} fill-current`} /> },
    { label: "Offers", icon: <CircleDollarSign className={`${ic} fill-current`} stroke="var(--color-card)" /> },
    { label: "Gift cards", icon: <CreditCard className={`${ic} fill-current`} stroke="var(--color-card)" /> },
  ];
  const security: Row[] = [
    { label: "Change Password", icon: <Lock className={`${ic} fill-current`} /> },
    { label: "Remembered Devices", icon: <Smartphone className={ic} /> },
    { label: "Identity Verification", icon: <IdCard className={`${ic} fill-current`} stroke="var(--color-card)" /> },
  ];
  const information: Row[] = [
    { label: "Legal", icon: <Files className={ic} /> },
    { label: "Helpful Information", icon: <Files className={ic} /> },
  ];
  const about: Row[] = [
    {
      label: "Technical Info",
      icon: (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-current">
          <VenmoMark className="h-2.5 w-2.5" title="" />
        </span>
      ),
    },
    { label: "Rate Venmo", icon: <Star className={`${ic} fill-current`} /> },
  ];

  const signOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    setTimeout(() => onSignOut?.(), 350);
  };

  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-2 p-2 text-subtle active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base font-medium text-muted-foreground">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="flex items-center gap-3 px-4 py-4">
          <VenmoMark className="h-7 w-7 text-border" />
          <div>
            <p className="text-sm text-foreground/80">Venmo is a service of PayPal, Inc.</p>
            <p className="text-xs text-subtle">NMLS ID: 910457</p>
          </div>
        </div>

        <Section title="Preferences" rows={preferences} />
        <Section title="Tax" rows={tax} />
        <Section title="Buying" rows={buying} />
        <Section title="Security" rows={security} />
        <Section title="Information" rows={information} />
        <Section rows={about} />

        <div className="mt-6">
          <button
            onClick={signOut}
            className={`flex min-h-12 w-full items-center gap-4 px-4 py-2 text-left transition-colors active:bg-muted ${
              signingOut ? "bg-muted" : ""
            }`}
          >
            <span className="flex w-6 justify-center text-subtle">
              <LogIn className={ic} strokeWidth={1.8} />
            </span>
            <span className="text-[0.95rem] leading-tight text-brand">Sign Out of Venmo</span>
          </button>
          <p className="px-4 pt-1 text-[0.7rem] text-subtle">Version 10.60.0 (3)</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, rows }: { title?: string; rows: Row[] }) {
  return (
    <section className={title ? "mt-3" : "mt-6"}>
      {title && <h2 className="px-4 pb-1 text-xs uppercase tracking-wide text-subtle">{title}</h2>}
      <ul>
        {rows.map((r) => (
          <li key={r.label}>
            <button
              onClick={r.onClick}
              className="flex min-h-12 w-full items-center gap-4 px-4 py-2 text-left active:bg-muted"
            >
              <span className="flex w-6 justify-center text-subtle">{r.icon}</span>
              <span className="flex-1 pr-2 text-[0.95rem] leading-tight text-foreground/80">{r.label}</span>
              <span className="ml-auto flex items-center gap-1">
                {r.badge && (
                  <span className="rounded-full bg-badge px-2 py-0.5 text-[0.65rem] font-bold text-brand-foreground">
                    New
                  </span>
                )}
                {r.value && <span className="text-sm text-subtle">{r.value}</span>}
                <ChevronRight className="h-4 w-4 text-subtle" strokeWidth={1.8} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
