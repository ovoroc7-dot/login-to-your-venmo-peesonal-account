import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Check, Globe, Users, Lock, ShieldCheck, FileText, Contact } from "lucide-react";
import { Spinner, VenmoMark, VenmoWordmark } from "./logos";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { parseWallet, type Privacy } from "./wallet";

/**
 * Venmo sign-up, in the order the real app uses:
 * phone → verify phone → register (name, username, email, password, agree) → legal → connect friends → payment privacy → welcome.
 */
type Stage = "phone" | "verify" | "register" | "legal" | "friends" | "privacy" | "welcome";
const STAGES: Stage[] = ["phone", "verify", "register", "legal", "friends", "privacy", "welcome"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[A-Za-z0-9_-]{5,30}$/;

function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function Field({
  label,
  value,
  onChange,
  inputRef,
  prefix,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  prefix?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "prefix">) {
  const [focus, setFocus] = useState(false);
  const float = focus || value.length > 0;
  return (
    <label
      className={`relative block h-14 rounded-md border bg-field px-3 transition ${
        focus ? "border-brand" : "border-field-border"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-3 text-subtle transition-all ${
          float ? "top-2 text-[0.68rem]" : "top-1/2 -translate-y-1/2 text-sm"
        }`}
      >
        {label}
      </span>
      <span className="absolute inset-x-3 bottom-1.5 flex h-7 items-center">
        {prefix && float && <span className="mr-1 text-[0.95rem] text-subtle">{prefix}</span>}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] text-foreground caret-brand outline-none"
          {...rest}
        />
      </span>
    </label>
  );
}

const PRIVACY_OPTIONS: { value: Privacy; icon: typeof Globe; title: string; body: string }[] = [
  { value: "Public", icon: Globe, title: "Public", body: "Visible to everyone on the internet" },
  { value: "Friends", icon: Users, title: "Friends", body: "Visible to the sender, recipient, and their friends" },
  { value: "Private", icon: Lock, title: "Private", body: "Visible to the sender and recipient only" },
];

export function SignUp({
  onClose,
  onSuccess,
  onLogin,
}: {
  onClose: () => void;
  onSuccess: (userId: string) => void;
  onLogin: () => void;
}) {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [privacy, setPrivacy] = useState<Privacy>("Private");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ref = stage === "phone" ? phoneRef : stage === "verify" ? codeRef : stage === "register" ? firstRef : null;
    if (!ref) return;
    const t = setTimeout(() => ref.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [stage]);

  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = username.trim().replace(/^@/, "");
  const pwOk = pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);

  const go = (s: Stage) => {
    (document.activeElement as HTMLElement | null)?.blur();
    setError(null);
    setStage(s);
  };

  const back = () => {
    setError(null);
    if (stage === "phone") onClose();
    else if (stage === "verify") setStage("phone");
    else if (stage === "register") setStage("verify");
    // Once the account exists, there is no going back before it.
  };

  const createAccount = async () => {
    setLoading(true);
    setError(null);
    const fullName = `${first.trim()} ${last.trim()}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pw,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: first.trim(),
          last_name: last.trim(),
          full_name: fullName,
          username: cleanUser,
          phone: `+1${phone}`,
        },
      },
    });
    if (signUpError) {
      setLoading(false);
      const msg = signUpError.message;
      if (/already|registered|exists/i.test(msg)) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (/weak|pwned|leaked|easy to guess|compromised/i.test(msg) || signUpError.code === "weak_password") {
        setError("That password has appeared in a data breach. Please choose a different one.");
      } else if (/fetch|network/i.test(msg)) {
        setError("Couldn't connect. Check your internet and try again.");
      } else {
        setError("We couldn't create your account. Please try again.");
      }
      return;
    }
    let id = data.session?.user.id ?? null;
    if (!id) {
      const res = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pw });
      id = res.data.user?.id ?? null;
    }
    setLoading(false);
    if (!id) {
      setError("Your account was created. Please log in to continue.");
      return;
    }
    setUserId(id);
    go("legal");
  };

  /** Saves the chosen payment privacy as the account's default for new payments. */
  const savePrivacy = async () => {
    if (!userId) return go("welcome");
    setLoading(true);
    const { data } = await supabase.from("wallets").select("data").eq("user_id", userId).maybeSingle();
    const wallet = parseWallet(data ? JSON.stringify(data.data) : null);
    await supabase
      .from("wallets")
      .upsert({ user_id: userId, data: { ...wallet, defaultPrivacy: privacy } as unknown as Json });
    setLoading(false);
    go("welcome");
  };

  const connectContacts = async () => {
    const nav = navigator as Navigator & { contacts?: { select: (p: string[], o: object) => Promise<unknown> } };
    try {
      if (nav.contacts?.select) await nav.contacts.select(["name", "tel", "email"], { multiple: true });
    } catch {
      // The person closed the contact picker; carry on.
    }
    go("privacy");
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (stage === "phone" && phone.length === 10) go("verify");
    else if (stage === "verify" && code.length === 6) go("register");
    else if (stage === "register" && registerOk) void createAccount();
  };

  const registerOk =
    first.trim().length > 0 &&
    last.trim().length > 0 &&
    USERNAME_RE.test(cleanUser) &&
    EMAIL_RE.test(cleanEmail) &&
    pwOk &&
    agree;

  const showBack = stage === "phone" || stage === "verify" || stage === "register";

  const header = (
    <div className="flex h-10 items-center">
      {showBack && (
        <button type="button" onClick={back} aria-label="Back" className="-ml-2 p-2 text-foreground active:opacity-60">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );

  const primary = (label: string, disabled: boolean, onClick?: () => void) => (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled || loading}
      className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground transition active:opacity-80 disabled:opacity-40"
    >
      {loading ? <Spinner className="h-5 w-5" /> : label}
    </button>
  );

  const errorLine = error && (
    <p role="alert" className="px-1 text-sm text-destructive">
      {error}
    </p>
  );

  /* ---------- Welcome onboarding ---------- */
  if (stage === "welcome") {
    return (
      <div className="flex h-full w-full flex-col items-center bg-brand px-6 pb-8 pt-16 text-brand-foreground animate-fade-soft">
        <VenmoMark className="h-16 w-16" />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-display">
            Welcome to Venmo, {first.trim()}!
          </h1>
          <p className="mt-4 max-w-[18rem] text-[1.05rem] font-medium leading-snug">
            Send and receive money with friends, split bills and pay your share — all in one place.
          </p>
          <p className="mt-6 rounded-full bg-brand-foreground/15 px-4 py-1.5 text-sm font-semibold">@{cleanUser}</p>
        </div>
        <button
          type="button"
          onClick={() => userId && onSuccess(userId)}
          className="h-14 w-full rounded-full bg-ink text-base font-semibold text-ink-foreground transition active:opacity-70"
        >
          Let's go
        </button>
      </div>
    );
  }

  return (
    <form
      key={stage}
      onSubmit={submit}
      className="flex h-full w-full flex-col overflow-y-auto bg-screen px-4 pb-6 pt-3 no-scrollbar animate-screen-in"
    >
      {header}

      {/* ---------- Phone ---------- */}
      {stage === "phone" && (
        <>
          <VenmoWordmark className="mx-auto mt-2 w-28 text-brand" />
          <h1 className="mt-8 text-2xl font-bold text-foreground">Enter your cell phone number</h1>
          <p className="mt-1 text-sm text-subtle">We'll text you a code to confirm it's you.</p>
          <div className="mt-6">
            <Field
              label="Cell phone number"
              value={formatPhone(phone)}
              onChange={(v) => setPhone(v.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10))}
              inputRef={phoneRef}
              prefix="+1"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              enterKeyHint="next"
            />
          </div>
          <div className="mt-auto pt-8">
            <p className="mb-3 px-2 text-center text-xs leading-snug text-subtle">
              Message and data rates may apply.
            </p>
            {primary("Next", phone.length !== 10)}
            <button type="button" onClick={onLogin} className="mx-auto mt-4 block text-sm font-semibold text-brand">
              I already have an account
            </button>
          </div>
        </>
      )}

      {/* ---------- Verify phone ---------- */}
      {stage === "verify" && (
        <>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Verify your phone</h1>
          <p className="mt-1 text-sm text-subtle">
            Enter the 6-digit code we sent to +1 {formatPhone(phone)}.
          </p>
          <label className="relative mt-8 block">
            <span className="sr-only">Verification code</span>
            <input
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="next"
              className="absolute inset-0 opacity-0"
              aria-label="Verification code"
            />
            <div className="pointer-events-none grid grid-cols-6 gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-14 items-center justify-center rounded-md border bg-field text-2xl font-semibold text-foreground ${
                    i === Math.min(code.length, 5) ? "border-brand" : "border-field-border"
                  }`}
                >
                  {code[i] ?? ""}
                </div>
              ))}
            </div>
          </label>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setResent(true);
              codeRef.current?.focus();
            }}
            className="mt-5 self-start text-sm font-semibold text-brand"
          >
            {resent ? "Code sent again" : "Send a new code"}
          </button>
          <div className="mt-auto pt-8">{primary("Next", code.length !== 6)}</div>
        </>
      )}

      {/* ---------- Register ---------- */}
      {stage === "register" && (
        <>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-subtle">Enter your legal name as it appears on your ID.</p>
          <div className="mt-5 space-y-3">
            <Field
              label="Legal first name"
              value={first}
              onChange={setFirst}
              inputRef={firstRef}
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Field
              label="Legal last name"
              value={last}
              onChange={setLast}
              autoComplete="family-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Field
              label="Username"
              value={cleanUser}
              onChange={(v) => setUsername(v.replace(/\s/g, ""))}
              prefix="@"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
            />
            {cleanUser.length > 0 && !USERNAME_RE.test(cleanUser) && (
              <p className="px-1 text-xs text-subtle">5–30 characters: letters, numbers, - or _</p>
            )}
            <Field
              label="Email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setError(null);
              }}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="next"
            />
            <div className="relative">
              <Field
                label="Password"
                value={pw}
                onChange={(v) => {
                  setPw(v);
                  setError(null);
                }}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="done"
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
                className="absolute right-0 top-0 flex h-14 w-14 items-center justify-center text-subtle"
              >
                {show ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>
            <p className={`flex items-center gap-2 px-1 text-xs ${pwOk ? "text-brand" : "text-subtle"}`}>
              <Check className={`h-3.5 w-3.5 ${pwOk ? "opacity-100" : "opacity-30"}`} strokeWidth={2.4} />
              At least 8 characters with a letter and a number
            </p>

            <div className="flex items-start gap-3 px-1 pt-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={agree}
                aria-label="I agree"
                onClick={() => setAgree((a) => !a)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                  agree ? "border-brand bg-brand text-brand-foreground" : "border-field-border bg-field"
                }`}
              >
                {agree && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <span className="text-xs leading-snug text-subtle" onClick={() => setAgree((a) => !a)}>
                I agree to Venmo's <span className="font-semibold text-brand">User Agreement</span>,{" "}
                <span className="font-semibold text-brand">Privacy Statement</span> and to receive account
                notifications by text and email.
              </span>
            </div>
            {errorLine}
          </div>
          <div className="mt-auto pt-6">
            {primary("Next", !registerOk)}
            {error?.includes("already exists") && (
              <button type="button" onClick={onLogin} className="mx-auto mt-4 block text-sm font-semibold text-brand">
                Log in instead
              </button>
            )}
          </div>
        </>
      )}

      {/* ---------- Legal ---------- */}
      {stage === "legal" && (
        <>
          <h1 className="mt-2 text-2xl font-bold text-foreground">The legal stuff you've been waiting for</h1>
          <p className="mt-1 text-sm text-subtle">A quick look at what you're agreeing to before you start.</p>
          <ul className="mt-6 space-y-5">
            {[
              { icon: FileText, title: "User Agreement", body: "The rules for using your account, sending and receiving money." },
              { icon: ShieldCheck, title: "Privacy Statement", body: "How your information is collected, used and kept safe." },
              { icon: Lock, title: "Electronic communications", body: "You agree to get statements and notices electronically." },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-[0.95rem] font-semibold text-foreground">{title}</span>
                  <span className="block text-sm leading-snug text-subtle">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <p className="mb-3 px-2 text-center text-xs leading-snug text-subtle">
              By tapping Agree, you confirm you've read and accept these terms.
            </p>
            {primary("Agree", false, () => go("friends"))}
          </div>
        </>
      )}

      {/* ---------- Connect friends ---------- */}
      {stage === "friends" && (
        <>
          <div className="mt-10 flex justify-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Contact className="h-11 w-11" strokeWidth={1.6} />
            </span>
          </div>
          <h1 className="mt-8 text-center text-2xl font-bold text-foreground">Connect to friends on Venmo</h1>
          <p className="mx-auto mt-2 max-w-[19rem] text-center text-sm leading-snug text-subtle">
            Find the people you know from your contacts so paying them is quicker.
          </p>
          <div className="mt-auto pt-8">
            {primary("Connect contacts", false, () => void connectContacts())}
            <button
              type="button"
              onClick={() => go("privacy")}
              className="mx-auto mt-4 block p-1 text-sm font-semibold text-brand"
            >
              Skip
            </button>
          </div>
        </>
      )}

      {/* ---------- Payment settings ---------- */}
      {stage === "privacy" && (
        <>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Payment settings</h1>
          <p className="mt-1 text-sm text-subtle">Who can see your payments? You can change this any time.</p>
          <div role="radiogroup" aria-label="Default privacy" className="mt-6 divide-y divide-field-border rounded-lg border border-field-border">
            {PRIVACY_OPTIONS.map(({ value, icon: Icon, title, body }) => {
              const on = privacy === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPrivacy(value)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-field"
                >
                  <Icon className="h-5 w-5 shrink-0 text-foreground" strokeWidth={1.8} />
                  <span className="flex-1">
                    <span className="block text-[0.95rem] font-semibold text-foreground">{title}</span>
                    <span className="block text-sm leading-snug text-subtle">{body}</span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      on ? "border-brand" : "border-field-border"
                    }`}
                  >
                    {on && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-8">{primary("Next", false, () => void savePrivacy())}</div>
        </>
      )}
    </form>
  );
}
