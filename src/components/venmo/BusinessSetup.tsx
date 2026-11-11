import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, CircleAlert, Pencil, Search, X } from "lucide-react";
import defaultCover from "@/assets/business-cover-default.jpg";
import { Spinner } from "./logos";
import {
  ABOUT_MAX,
  CATEGORIES,
  DEFAULT_TIPS,
  NAME_HINT,
  businessNameError,
  businessUsernameError,
  type BusinessProfile,
} from "./business";
import { prepareImage, uploadImage, useStoredImage } from "./businessMedia";

type Picked = { blob: Blob; preview: string };

/**
 * Venmo "Create a business profile" flow: name your business (photo, cover, name, username) →
 * share highlights (about + category). Also used to edit an existing profile.
 */
export function BusinessSetup({
  userId,
  personalName,
  personalUsername,
  existing,
  onClose,
  onSaved,
}: {
  userId: string;
  personalName: string;
  personalUsername: string;
  existing?: BusinessProfile | undefined;
  onClose: () => void;
  onSaved: (profile: BusinessProfile) => void;
}) {
  const [step, setStep] = useState<"name" | "highlights">("name");
  const [name, setName] = useState(existing?.name ?? "");
  const [username, setUsername] = useState(existing?.username ?? "");
  const [touchedUser, setTouchedUser] = useState(!!existing);
  const [about, setAbout] = useState(existing?.about ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [sub, setSub] = useState(existing?.subcategory ?? "");
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [cover, setCover] = useState<Picked | null>(null);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const savedPhoto = useStoredImage(existing?.photoPath ?? null);
  const savedCover = useStoredImage(existing?.coverPath ?? null);

  const nameErr = businessNameError(name, personalName);
  const userErr = businessUsernameError(username, personalUsername);
  const cleanUser = username.trim().replace(/^@/, "");

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.preview);
      if (cover) URL.revokeObjectURL(cover.preview);
    },
    [photo, cover],
  );

  const pick = async (e: React.ChangeEvent<HTMLInputElement>, kind: "photo" | "cover") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const blob = kind === "photo" ? await prepareImage(file, 640, 640) : await prepareImage(file, 1200, 520);
      const next = { blob, preview: URL.createObjectURL(blob) };
      if (kind === "photo") setPhoto(next);
      else setCover(next);
    } catch {
      setError("We couldn't open that picture. Try a different one.");
    }
  };

  const save = async () => {
    if (saving || nameErr || userErr || !sub) return;
    setSaving(true);
    setError(null);
    let photoPath = existing?.photoPath ?? null;
    let coverPath = existing?.coverPath ?? null;
    if (photo) photoPath = await uploadImage(userId, photo.blob, "photo");
    if (cover) coverPath = await uploadImage(userId, cover.blob, "cover");
    if ((photo && !photoPath) || (cover && !coverPath)) {
      setSaving(false);
      setError("We couldn't upload your pictures. Check your connection and try again.");
      return;
    }
    onSaved({
      name: name.trim().replace(/\s+/g, " "),
      username: cleanUser,
      about: about.trim(),
      category,
      subcategory: sub,
      photoPath,
      coverPath,
      contactInstructions: existing?.contactInstructions ?? "",
      gallery: existing?.gallery ?? [],
      tipsOn: existing?.tipsOn ?? false,
      tips: existing?.tips ?? DEFAULT_TIPS,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
  };

  const photoSrc = photo?.preview ?? savedPhoto;
  const coverSrc = cover?.preview ?? savedCover ?? (existing?.coverPath ? null : defaultCover);

  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="flex h-12 shrink-0 items-center px-2">
        <button
          aria-label="Back"
          onClick={() => (step === "highlights" ? setStep("name") : onClose())}
          className="p-2 text-foreground active:opacity-60"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </header>

      {step === "name" ? (
        <div key="name" className="flex-1 overflow-y-auto px-4 pb-6 animate-fade-soft">
          <h1 className="text-center text-xl font-medium text-foreground">Let's name your business</h1>

          <div className="relative mt-5">
            <div className="relative h-40 overflow-hidden rounded-xl bg-muted">
              {coverSrc && <img src={coverSrc} alt="" className="h-full w-full object-cover" />}
              <button
                aria-label="Change cover photo"
                onClick={() => coverInput.current?.click()}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow active:opacity-70"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <button
              onClick={() => photoInput.current?.click()}
              aria-label={photoSrc ? "Change business photo" : "Add photo"}
              className="absolute -bottom-10 left-1/2 flex h-28 w-28 -translate-x-1/2 items-center justify-center overflow-visible rounded-full border border-border bg-card text-sm text-foreground/70 shadow-sm active:opacity-80"
            >
              {photoSrc ? (
                <img src={photoSrc} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                "Add photo"
              )}
              <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-foreground shadow">
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </button>
          </div>
          <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e, "photo")} />
          <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e, "cover")} />

          <div className="mt-16 space-y-1">
            <Field
              label="Business name"
              value={name}
              onChange={setName}
              valid={!nameErr}
              invalid={!!name && !!nameErr}
              autoComplete="organization"
            />
            <p className={`px-1 pb-3 text-xs ${name && nameErr ? "text-minus" : "text-subtle"}`}>
              {name && !nameErr ? "" : (nameErr ?? NAME_HINT)}
            </p>
            <Field
              label="Business username"
              value={username}
              prefix="@"
              onChange={(v) => {
                setTouchedUser(true);
                setUsername(v.replace(/\s/g, ""));
              }}
              valid={!userErr}
              invalid={touchedUser && !!cleanUser && !!userErr}
              autoComplete="off"
            />
            <p
              className={`px-1 text-xs leading-snug ${
                touchedUser && cleanUser && userErr ? "text-minus" : !userErr ? "text-go" : "text-subtle"
              }`}
            >
              {!cleanUser
                ? "Using your business name helps people find you more easily."
                : userErr
                  ? userErr
                  : `Your current username @${personalUsername} will continue to be used for personal payments.`}
            </p>
          </div>
          {error && <p className="mt-4 text-center text-sm text-minus">{error}</p>}
        </div>
      ) : (
        <div key="hl" className="flex-1 overflow-y-auto px-4 pb-6 animate-fade-soft">
          <h1 className="text-center text-xl font-medium text-foreground">Share highlights of your business</h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-foreground/70">
            Let people know what you have to offer and why you're great at what you do.
          </p>
          <label className="mt-6 block rounded-lg border border-field-border px-3 pb-2 pt-2 focus-within:border-brand">
            <span className={`block text-xs ${about ? "text-brand" : "text-subtle"}`}>Talk about your business</span>
            <textarea
              value={about}
              maxLength={ABOUT_MAX}
              onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_MAX))}
              rows={4}
              className="mt-1 block w-full resize-none bg-transparent text-[0.95rem] text-foreground outline-none"
            />
            <span className={`block text-xs ${about ? "text-brand" : "text-subtle"}`}>
              {ABOUT_MAX - about.length} characters remaining
            </span>
          </label>
          <button
            onClick={() => setPicker(true)}
            className="mt-6 flex min-h-12 w-full flex-col justify-center rounded-lg border border-field-border px-3 py-2 text-left active:bg-muted"
          >
            {sub ? (
              <>
                <span className="text-xs text-subtle">Business category</span>
                <span className="text-[0.95rem] text-foreground">{sub}</span>
              </>
            ) : (
              <span className="text-[0.95rem] text-subtle">Pick a business category</span>
            )}
          </button>
          <p className="mt-2 px-1 text-xs text-subtle">Make searches easier. Choose a category that fits your business.</p>
          {error && <p className="mt-4 text-center text-sm text-minus">{error}</p>}
        </div>
      )}

      <div className="shrink-0 px-4 pb-4 pt-2">
        <button
          disabled={step === "name" ? !!nameErr || !!userErr : !sub || saving}
          onClick={() => (step === "name" ? setStep("highlights") : void save())}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80 disabled:opacity-40"
        >
          {saving ? <Spinner className="h-5 w-5" /> : step === "highlights" && existing ? "Save" : "Next"}
        </button>
      </div>

      {picker && (
        <CategorySheet
          onClose={() => setPicker(false)}
          onPick={(c, s) => {
            setCategory(c);
            setSub(s);
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  valid,
  invalid,
  prefix,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean;
  invalid: boolean;
  prefix?: string;
  autoComplete?: string;
}) {
  const [focus, setFocus] = useState(false);
  const up = focus || !!value;
  return (
    <label
      className={`relative flex h-14 items-end rounded-lg border px-3 pb-2 ${
        invalid ? "border-minus" : focus ? "border-brand" : "border-field-border"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-3 transition-all ${
          up ? "top-1.5 text-xs" : "top-4 text-[0.95rem]"
        } ${invalid ? "text-minus" : up ? "text-brand" : "text-subtle"}`}
      >
        {label}
      </span>
      {prefix && up && <span className="text-[0.95rem] text-foreground">{prefix}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        autoComplete={autoComplete}
        autoCapitalize={prefix ? "none" : "words"}
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-foreground outline-none"
      />
      {valid && value && <Check className="mb-0.5 h-5 w-5 text-go" strokeWidth={2.6} />}
      {invalid && <CircleAlert className="mb-0.5 h-5 w-5 text-minus" strokeWidth={2.4} />}
    </label>
  );
}

function CategorySheet({ onClose, onPick }: { onClose: () => void; onPick: (category: string, sub: string) => void }) {
  const [type, setType] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () =>
      query
        ? CATEGORIES.flatMap((c) => c.subs.filter((s) => s.toLowerCase().includes(query)).map((s) => ({ c: c.name, s })))
        : [],
    [query],
  );
  const subs = CATEGORIES.find((c) => c.name === type)?.subs ?? [];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-scrim animate-fade-soft">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Business category"
        className="flex h-[94%] flex-col rounded-t-2xl bg-card animate-sheet-up"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex h-12 items-center justify-between px-2">
          {type ? (
            <button aria-label="Back" onClick={() => setType(null)} className="p-2 text-subtle active:opacity-60">
              <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
          ) : (
            <span />
          )}
          <button aria-label="Close" onClick={onClose} className="p-2 text-subtle active:opacity-60">
            <X className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
        <h2 className="px-6 text-center text-lg font-medium text-foreground">
          {type ? "Which category best describes your business?" : "What type of business do you run?"}
        </h2>
        {!type && (
          <label className="mx-4 mt-5 flex h-11 items-center gap-2 rounded-lg border border-field-border px-3">
            <Search className="h-4 w-4 text-subtle" strokeWidth={2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for a category"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-subtle"
            />
          </label>
        )}
        <ul className="mt-3 flex-1 overflow-y-auto pb-8">
          {type
            ? subs.map((s) => (
                <li key={s}>
                  <button onClick={() => onPick(type, s)} className="w-full px-4 py-3 text-left text-[0.95rem] font-medium text-foreground active:bg-muted">
                    {s}
                  </button>
                </li>
              ))
            : query
              ? results.map((r) => (
                  <li key={r.c + r.s}>
                    <button onClick={() => onPick(r.c, r.s)} className="w-full px-4 py-3 text-left active:bg-muted">
                      <span className="block text-[0.95rem] font-medium text-foreground">{r.s}</span>
                      <span className="block text-xs text-subtle">{r.c}</span>
                    </button>
                  </li>
                ))
              : CATEGORIES.map((c) => (
                  <li key={c.name}>
                    <button onClick={() => setType(c.name)} className="w-full px-4 py-3 text-left text-[0.95rem] font-medium text-foreground active:bg-muted">
                      {c.name}
                    </button>
                  </li>
                ))}
          {query && !type && results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-subtle">No categories match "{q.trim()}"</li>
          )}
        </ul>
      </div>
    </div>
  );
}
