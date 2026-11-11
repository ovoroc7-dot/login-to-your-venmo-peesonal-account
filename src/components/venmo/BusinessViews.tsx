import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Files,
  Globe,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smile,
  Star,
  Store,
  User,
  IdCard,
  X,
} from "lucide-react";
import defaultCover from "@/assets/business-cover-default.jpg";
import city from "@/assets/avatar-city.jpg";
import tyler from "@/assets/avatar-tyler.jpg";
import barbara from "@/assets/avatar-barbara.jpg";
import { VenmoMark } from "./logos";
import { cleanAmount, formatMoney, toCents } from "./amount";
import { maxCustomTip, tipCents, tipError, type BusinessProfile } from "./business";
import { useStoredImage } from "./businessMedia";

/** The business's photo, or a plain store picture until one is added. */
export function BusinessPhoto({ profile, className = "h-11 w-11", ring = "" }: { profile: BusinessProfile; className?: string; ring?: string }) {
  const url = useStoredImage(profile.photoPath);
  if (url) return <img src={url} alt="" className={`${className} ${ring} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`${className} ${ring} flex shrink-0 items-center justify-center rounded-full bg-muted text-subtle`}>
      <Store className="h-1/2 w-1/2" strokeWidth={1.8} />
    </span>
  );
}

export function useCover(profile: BusinessProfile) {
  const url = useStoredImage(profile.coverPath);
  return profile.coverPath ? url : defaultCover;
}

/** How customers see the business profile, with the Pay → Add a tip? sheet. */
export function BusinessPublicProfile({
  profile,
  email,
  phone,
  onBack,
  onSettings,
  onEdit,
}: {
  profile: BusinessProfile;
  email: string;
  phone: string;
  onBack: () => void;
  onSettings: () => void;
  onEdit: () => void;
}) {
  const cover = useCover(profile);
  const [tab, setTab] = useState<"all" | "between">("all");
  const [paying, setPaying] = useState(false);
  return (
    <div className="relative flex h-full flex-col bg-card animate-push-in">
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="relative h-44 bg-muted">
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
          <button
            aria-label="Back"
            onClick={onBack}
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-ink-foreground active:opacity-70"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <button
            aria-label="Business settings"
            onClick={onSettings}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-ink-foreground active:opacity-70"
          >
            <Ellipsis className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
        <div className="-mt-20 flex justify-center">
          <BusinessPhoto profile={profile} className="h-36 w-36" ring="border-4 border-card" />
        </div>
        <h1 className="mt-2 px-4 text-center text-xl text-foreground">{profile.name}</h1>
        <p className="text-center text-sm text-subtle">@{profile.username}</p>

        <div className="px-4">
          <button
            onClick={() => setPaying(true)}
            className="mt-6 h-11 w-full rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80"
          >
            Pay
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 fill-brand text-card" strokeWidth={2} />
            Eligible items covered by <span className="font-semibold text-brand">Purchase Protection</span>
          </p>

          <div className="mt-5 flex justify-center gap-8">
            <Contact icon={<Phone className="h-4 w-4 fill-current" strokeWidth={1.5} />} label="Phone" href={phone ? `tel:${phone}` : undefined} />
            <Contact icon={<Mail className="h-4 w-4" strokeWidth={2} />} label="Email" href={email ? `mailto:${email}` : undefined} />
            <Contact icon={<MapPin className="h-4 w-4" strokeWidth={2} />} label="Address" />
          </div>

          {profile.about && <p className="mt-5 text-sm text-foreground">{profile.about}</p>}

          <div className="mt-4 flex items-center gap-3">
            <span className="flex -space-x-2">
              {[city, tyler, barbara].map((src, i) => (
                <img key={i} src={src} alt="" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
              ))}
            </span>
            <p className="text-xs text-subtle">Customers' friends who also bought from you will show up here.</p>
          </div>

          <div role="tablist" className="mt-6 grid grid-cols-2 text-sm">
            {(
              [
                ["all", "All stories"],
                ["between", "Between You"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`pb-2 ${tab === k ? "font-semibold text-foreground" : "text-subtle"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-foreground/80">
            This is how your profile looks to <Globe className="h-4 w-4" strokeWidth={2} />
            <span className="font-semibold">Public</span>
          </p>
          <button onClick={onEdit} className="mt-4 h-11 w-full rounded-full border border-border text-base font-semibold text-brand active:bg-muted">
            Edit
          </button>
        </div>
      </div>
      {paying && <TipSheet profile={profile} onClose={() => setPaying(false)} />}
    </div>
  );
}

function Contact({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string | undefined }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground/80 text-foreground">{icon}</span>
      <span className="text-xs text-foreground/80">{label}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex flex-col items-center gap-1 active:opacity-60">
      {inner}
    </a>
  ) : (
    <span className="flex flex-col items-center gap-1 opacity-60">{inner}</span>
  );
}

/** What a customer sees when paying this business: amount, then Add a tip? with the business's tip choices. */
function TipSheet({ profile, onClose }: { profile: BusinessProfile; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [choice, setChoice] = useState<number | "custom" | null>(null);
  const [custom, setCustom] = useState("");
  const [done, setDone] = useState(false);
  const cents = toCents(amount);
  const customCents = Math.min(toCents(custom), maxCustomTip(cents));
  const tip = choice === "custom" ? customCents : choice === null ? 0 : tipCents(cents, profile.tips[choice] ?? 0);
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-scrim animate-fade-soft">
      <button aria-label="Close" className="flex-1" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Pay ${profile.name}`} className="rounded-t-3xl bg-card px-4 pb-6 pt-3 animate-sheet-up">
        <div className="flex justify-end">
          <button aria-label="Close" onClick={onClose} className="p-1 text-subtle active:opacity-60">
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <BusinessPhoto profile={profile} className="h-16 w-16" />
          <h2 className="mt-2 text-lg text-foreground">{profile.name}</h2>
          <label className="mt-3 flex items-start text-foreground">
            <span className="mt-1 text-xl">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(cleanAmount(e.target.value))}
              inputMode="decimal"
              placeholder="0"
              aria-label="Amount"
              autoFocus
              className="w-40 bg-transparent text-center text-5xl leading-none tracking-tight outline-none placeholder:text-foreground"
            />
          </label>
          {profile.tipsOn && cents > 0 && (
            <>
              <p className="mt-4 text-sm font-semibold text-foreground">Add a tip?</p>
              <div className="mt-3 flex gap-2">
                {profile.tips.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setChoice(choice === i ? null : i)}
                    className={`flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full border-2 text-sm ${
                      choice === i ? "border-go bg-go text-go-foreground" : "border-go/40 text-go"
                    }`}
                  >
                    <span className="font-bold">{p}%</span>
                    <span className="text-xs">${formatMoney(tipCents(cents, p))}</span>
                  </button>
                ))}
                <button
                  onClick={() => setChoice(choice === "custom" ? null : "custom")}
                  className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 text-sm font-bold ${
                    choice === "custom" ? "border-go bg-go text-go-foreground" : "border-go/40 text-go"
                  }`}
                >
                  Custom
                </button>
              </div>
              {choice === "custom" && (
                <label className="mt-3 flex items-center gap-1 rounded-lg border border-field-border px-3 py-2 text-sm">
                  Tip $
                  <input
                    value={custom}
                    onChange={(e) => setCustom(cleanAmount(e.target.value))}
                    inputMode="decimal"
                    aria-label="Custom tip"
                    className="w-20 bg-transparent outline-none"
                  />
                  <span className="text-xs text-subtle">max ${formatMoney(maxCustomTip(cents))}</span>
                </label>
              )}
            </>
          )}
        </div>
        {done ? (
          <p role="status" className="mt-5 rounded-lg bg-muted px-3 py-3 text-center text-sm text-foreground/80">
            This is a preview of your profile. Customers see this screen when they pay you.
          </p>
        ) : (
          <button
            disabled={cents <= 0}
            onClick={() => setDone(true)}
            className="mt-5 h-12 w-full rounded-full bg-go text-base font-bold text-go-foreground shadow-md active:opacity-80 disabled:opacity-40"
          >
            Pay ${formatMoney(cents + tip)}
          </button>
        )}
      </div>
    </div>
  );
}

type Row = { label: string; icon: React.ReactNode; value?: string; onClick?: (() => void) | undefined };
const ic = "h-5 w-5";

export function BusinessSettings({
  tipsOn,
  onBack,
  onEdit,
  onPaymentMethods,
  onPrivacy,
  onTipping,
}: {
  tipsOn: boolean;
  onBack: () => void;
  onEdit: () => void;
  onPaymentMethods: () => void;
  onPrivacy: () => void;
  onTipping: () => void;
}) {
  const sections: { title: string; rows: Row[] }[] = [
    {
      title: "Preferences",
      rows: [
        { label: "Edit Business Profile", icon: <User className={`${ic} fill-current`} />, onClick: onEdit },
        { label: "Payment Methods", icon: <Landmark className={ic} />, onClick: onPaymentMethods },
        { label: "Privacy", icon: <Lock className={`${ic} fill-current`} />, onClick: onPrivacy },
        { label: "Emoji", icon: <Smile className={ic} strokeWidth={1.6} /> },
        { label: "Get help", icon: <span className="text-xl font-bold leading-none">?</span> },
      ],
    },
    {
      title: "Selling",
      rows: [
        { label: "Sales Tax", icon: <Files className={ic} /> },
        { label: "Tipping", icon: <Star className={`${ic} fill-current`} />, value: tipsOn ? "On" : "Off", onClick: onTipping },
        { label: "Marketing settings", icon: <Files className={ic} /> },
        { label: "Disputes", icon: <Files className={ic} /> },
      ],
    },
    {
      title: "Tax",
      rows: [
        { label: "Identity Verification", icon: <IdCard className={`${ic} fill-current`} stroke="var(--color-card)" /> },
        { label: "Tax Documents", icon: <Files className={ic} /> },
      ],
    },
  ];
  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-2 p-2 text-brand active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base font-medium text-foreground">Settings</h1>
      </header>
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="flex items-center gap-3 px-4 py-4">
          <VenmoMark className="h-7 w-7 text-border" />
          <div>
            <p className="text-sm text-foreground/80">Venmo is a service of PayPal, Inc.</p>
            <p className="text-xs text-subtle">NMLS ID: 910457</p>
          </div>
        </div>
        {sections.map((s) => (
          <section key={s.title} className="mt-3">
            <h2 className="px-4 pb-1 text-xs uppercase tracking-wide text-subtle">{s.title}</h2>
            <ul>
              {s.rows.map((r) => (
                <li key={r.label}>
                  <button onClick={r.onClick} className="flex min-h-12 w-full items-center gap-4 px-4 py-2 text-left active:bg-muted">
                    <span className="flex w-6 justify-center text-subtle">{r.icon}</span>
                    <span className="flex-1 text-[0.95rem] text-foreground/80">{r.label}</span>
                    {r.value && <span className="text-sm text-subtle">{r.value}</span>}
                    <ChevronRight className="h-4 w-4 text-subtle" strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function TippingScreen({
  tipsOn,
  tips,
  onBack,
  onToggle,
  onSave,
}: {
  tipsOn: boolean;
  tips: number[];
  onBack: () => void;
  onToggle: (on: boolean) => void;
  onSave: (tips: number[]) => void;
}) {
  const [values, setValues] = useState(tips.map(String));
  const errors = values.map(tipError);
  const changed = values.some((v, i) => Number(v) !== tips[i]);
  const valid = errors.every((e) => !e);
  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="relative flex h-12 shrink-0 items-center justify-center">
        <button aria-label="Back" onClick={onBack} className="absolute left-2 p-2 text-foreground active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-base font-medium text-foreground">Tipping</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex items-center justify-between py-3">
          <span className="text-[0.95rem] text-foreground">Allow tips</span>
          <button
            role="switch"
            aria-checked={tipsOn}
            aria-label="Allow tips"
            onClick={() => onToggle(!tipsOn)}
            className={`relative h-8 w-14 rounded-full transition-colors ${tipsOn ? "bg-go/25" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 flex h-7 w-7 items-center justify-center rounded-full shadow transition-all ${
                tipsOn ? "left-[1.6rem] bg-go text-go-foreground" : "left-0.5 bg-card"
              }`}
            >
              {tipsOn && <span className="text-sm font-bold">✓</span>}
            </span>
          </button>
        </div>
        {!tipsOn ? (
          <p className="text-sm text-foreground/80">Collect tips using amounts you set</p>
        ) : (
          <>
            <h2 className="mt-3 text-base font-medium text-foreground">Set your tip amounts</h2>
            <div className="mt-3 space-y-2">
              {values.map((v, i) => (
                <label
                  key={i}
                  className={`flex h-14 flex-col justify-center rounded-lg border px-3 focus-within:border-brand ${
                    errors[i] ? "border-minus" : "border-field-border"
                  }`}
                >
                  <span className={`text-xs ${errors[i] ? "text-minus" : "text-subtle"}`}>Tip {i + 1}</span>
                  <span className="flex items-center">
                    <input
                      value={v}
                      inputMode="numeric"
                      aria-label={`Tip ${i + 1} percent`}
                      onChange={(e) => {
                        const next = [...values];
                        next[i] = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setValues(next);
                      }}
                      style={{ width: `${Math.max(1, v.length) + 0.5}ch` }}
                      className="bg-transparent text-[0.95rem] text-foreground outline-none"
                    />
                    <span className="text-[0.95rem] text-foreground">%</span>
                    {errors[i] && <span className="ml-auto text-xs text-minus">{errors[i]}</span>}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-sm leading-snug text-foreground">
              Your customers will also be able to choose a custom tip or no tip. Custom tips can't exceed $1000 or 5x the
              original transaction amount, whichever is smaller.
            </p>
            <p className="mt-4 text-sm leading-snug text-foreground">
              The transaction fee you're charged is based on the total transaction amount, including tip.
            </p>
            {changed && (
              <button
                disabled={!valid}
                onClick={() => onSave(values.map(Number))}
                className="mt-6 h-12 w-full rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80 disabled:opacity-40"
              >
                Save
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
