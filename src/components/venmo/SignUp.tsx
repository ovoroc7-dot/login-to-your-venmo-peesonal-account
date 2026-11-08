import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { Spinner, VenmoWordmark } from "./logos";
import { supabase } from "@/integrations/supabase/client";

type Stage = "name" | "email" | "password";
const STAGES: Stage[] = ["name", "email", "password"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({
  label,
  value,
  onChange,
  inputRef,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
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
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="absolute inset-x-3 bottom-1.5 h-7 bg-transparent text-[0.95rem] text-foreground caret-brand outline-none"
        {...rest}
      />
    </label>
  );
}

export function SignUp({
  onClose,
  onSuccess,
  onLogin,
}: {
  onClose: () => void;
  onSuccess: (userId: string) => void;
  onLogin: () => void;
}) {
  const [stage, setStage] = useState<Stage>("name");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      (stage === "name" ? firstRef : stage === "email" ? emailRef : pwRef).current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [stage]);

  const idx = STAGES.indexOf(stage);
  const cleanEmail = email.trim().toLowerCase();
  const rules = [
    { ok: pw.length >= 8, text: "At least 8 characters" },
    { ok: /[a-zA-Z]/.test(pw) && /\d/.test(pw), text: "A letter and a number" },
  ];

  const canContinue =
    stage === "name"
      ? first.trim().length > 0 && last.trim().length > 0
      : stage === "email"
        ? EMAIL_RE.test(cleanEmail)
        : rules.every((r) => r.ok);

  const back = () => {
    setError(null);
    if (idx === 0) onClose();
    else setStage(STAGES[idx - 1] ?? "name");
  };

  const create = async () => {
    setLoading(true);
    setError(null);
    const fullName = `${first.trim()} ${last.trim()}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pw,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: first.trim(), last_name: last.trim(), full_name: fullName },
      },
    });
    if (signUpError) {
      setLoading(false);
      const msg = signUpError.message;
      if (/already|registered|exists/i.test(msg)) {
        setStage("email");
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
    let userId = data.session?.user.id ?? null;
    if (!userId) {
      // Sign in right away when the account is ready to use.
      const res = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pw });
      userId = res.data.user?.id ?? null;
    }
    if (!userId) {
      setLoading(false);
      setError("Your account was created. Please log in to continue.");
      return;
    }
    onSuccess(userId);
  };

  const next = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!canContinue) return;
    (document.activeElement as HTMLElement | null)?.blur();
    setError(null);
    if (stage === "password") void create();
    else setStage(STAGES[idx + 1] ?? "password");
  };

  const title =
    stage === "name" ? "What's your name?" : stage === "email" ? "What's your email?" : "Create a password";
  const sub =
    stage === "name"
      ? "Enter your name as it appears on your ID."
      : stage === "email"
        ? "You'll use this email to log in on any phone or computer."
        : "Use it with your email to log in on any device.";

  return (
    <form onSubmit={next} className="flex h-full w-full flex-col bg-screen px-4 pb-6 pt-3 animate-screen-in">
      <div className="flex items-center justify-between">
        <button type="button" onClick={back} aria-label="Back" className="-ml-2 p-2 text-foreground active:opacity-60">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <div className="flex gap-1.5" aria-label={`Step ${idx + 1} of ${STAGES.length}`}>
          {STAGES.map((s, i) => (
            <span key={s} className={`h-1 w-6 rounded-full ${i <= idx ? "bg-brand" : "bg-field-border"}`} />
          ))}
        </div>
        <span className="w-9" />
      </div>

      <VenmoWordmark className="mx-auto mt-4 w-28 text-brand" />

      <h1 className="mt-8 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-subtle">{sub}</p>

      <div className="mt-6 space-y-3">
        {stage === "name" && (
          <>
            <Field
              label="First name"
              value={first}
              onChange={setFirst}
              inputRef={firstRef}
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Field
              label="Last name"
              value={last}
              onChange={setLast}
              autoComplete="family-name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
          </>
        )}

        {stage === "email" && (
          <Field
            label="Email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(null);
            }}
            inputRef={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="next"
          />
        )}

        {stage === "password" && (
          <>
            <div className="relative">
              <Field
                label="Password"
                value={pw}
                onChange={(v) => {
                  setPw(v);
                  setError(null);
                }}
                inputRef={pwRef}
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
            <ul className="space-y-1 px-1 pt-1">
              {rules.map((r) => (
                <li key={r.text} className={`flex items-center gap-2 text-sm ${r.ok ? "text-brand" : "text-subtle"}`}>
                  <Check className={`h-4 w-4 ${r.ok ? "opacity-100" : "opacity-30"}`} strokeWidth={2.2} />
                  {r.text}
                </li>
              ))}
            </ul>
          </>
        )}

        {error && (
          <p role="alert" className="px-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="mt-auto pt-8">
        {stage === "password" && (
          <p className="mb-3 px-2 text-center text-xs leading-snug text-subtle">
            By tapping Create account, you agree to Venmo's User Agreement and Privacy Statement.
          </p>
        )}
        <button
          type="submit"
          disabled={!canContinue}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground transition active:opacity-80 disabled:opacity-40"
        >
          {loading ? <Spinner className="h-5 w-5" /> : stage === "password" ? "Create account" : "Next"}
        </button>
        <button type="button" onClick={onLogin} className="mx-auto mt-4 block text-sm font-semibold text-brand">
          I already have an account
        </button>
      </div>
    </form>
  );
}
