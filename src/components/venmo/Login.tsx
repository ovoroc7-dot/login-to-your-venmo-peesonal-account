import { useRef, useState } from "react";
import { X, Eye, EyeOff, CircleX } from "lucide-react";
import { Spinner, VenmoWordmark } from "./logos";
import { supabase } from "@/integrations/supabase/client";

export function Login({ onClose, onSuccess }: { onClose: () => void; onSuccess: (userId: string) => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState<"id" | "pw" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!id.trim()) return idRef.current?.focus();
    if (!pw) return pwRef.current?.focus();
    (document.activeElement as HTMLElement | null)?.blur();
    setError(null);
    setLoading(true);
    const email = id.trim().toLowerCase();
    if (!email.includes("@")) {
      setLoading(false);
      setError("Please enter the email address on your account.");
      return;
    }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (signInError || !data.user) {
      setLoading(false);
      setError(
        signInError && /fetch|network/i.test(signInError.message)
          ? "Couldn't connect. Check your internet and try again."
          : "The email or password you entered is incorrect.",
      );
      return;
    }
    onSuccess(data.user.id);
  };

  const idFloat = focus === "id" || id.length > 0;
  const pwFloat = focus === "pw" || pw.length > 0;

  return (
    <form
      onSubmit={submit}
      className="flex h-full w-full flex-col bg-screen px-4 pb-6 pt-3 animate-screen-in"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 text-subtle active:opacity-60"
        >
          <X className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      <VenmoWordmark className="mx-auto mt-2 w-32 text-brand" />

      <div className="mt-8 space-y-3">
        {/* Email / username / phone */}
        <label
          className={`relative block h-14 rounded-md border bg-field px-3 transition ${
            focus === "id" ? "border-brand" : "border-field-border"
          }`}
        >
          <span
            className={`pointer-events-none absolute left-3 text-subtle transition-all ${
              idFloat ? "top-2 text-[0.68rem]" : "top-1/2 -translate-y-1/2 text-sm"
            }`}
          >
            Email, username or phone number
          </span>
          <input
            ref={idRef}
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError(null);
            }}
            inputMode="email"
            onFocus={() => setFocus("id")}
            onBlur={() => setFocus(null)}
            autoComplete="username"
            autoCapitalize="none"
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                pwRef.current?.focus();
              }
            }}
            className="absolute inset-x-3 bottom-1.5 h-7 bg-transparent text-[0.95rem] text-foreground caret-brand outline-none"
          />
        </label>

        {/* Password + eye */}
        <div className="flex h-14 rounded-md border border-field-border bg-field">
          <label
            className={`relative -m-px block flex-1 rounded-md border px-3 transition ${
              focus === "pw" ? "border-brand" : "border-transparent"
            }`}
          >
            <span
              className={`pointer-events-none absolute left-3 text-subtle transition-all ${
                pwFloat ? "top-2 text-[0.68rem]" : "top-1/2 -translate-y-1/2 text-sm"
              }`}
            >
              Password
            </span>
            <input
              ref={pwRef}
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(null);
              }}
              onFocus={() => setFocus("pw")}
              onBlur={() => setFocus(null)}
              autoComplete="current-password"
              enterKeyHint="done"
              className="absolute bottom-1.5 left-3 right-9 h-7 bg-transparent text-[0.95rem] tracking-wider text-foreground caret-brand outline-none"
            />
            {focus === "pw" && pw.length > 0 && (
              <button
                type="button"
                aria-label="Clear password"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPw("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-subtle"
              >
                <CircleX className="h-4 w-4 fill-subtle text-field" />
              </button>
            )}
          </label>
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((s) => !s)}
            className="flex w-14 items-center justify-center border-l border-field-border text-subtle"
          >
            {show ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
        {error && (
          <p role="alert" className="px-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="mt-auto pt-10">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground transition active:opacity-80"
        >
          {loading ? <Spinner className="h-5 w-5" /> : "Log in"}
        </button>
        <button type="button" className="mx-auto mt-4 block text-sm font-semibold text-brand">
          Forgot password?
        </button>
      </div>
    </form>
  );
}
