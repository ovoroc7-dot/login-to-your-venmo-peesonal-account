import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Trash2 } from "lucide-react";
import { Spinner } from "./logos";
import { MyPhoto, preparePhoto, removeProfilePhoto, saveProfilePhoto, useProfilePhoto } from "./profilePhoto";

/**
 * Venmo-style profile photo flow: tap your photo → choose Take photo / Choose from library →
 * preview the new photo in a circle → Save. Rendered from Home so it covers the bottom bar.
 */
export function ProfilePhotoSheet({
  userId,
  onClose,
  onDone,
}: {
  userId: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { url } = useProfilePhoto();
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.preview);
  }, [photo]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const blob = await preparePhoto(file);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
    } catch {
      setError("We couldn't open that picture. Try a different one.");
    }
  };

  const save = async () => {
    if (!photo || busy) return;
    setBusy(true);
    const ok = await saveProfilePhoto(userId, photo.blob);
    setBusy(false);
    if (ok) onDone("Profile photo updated");
    else setError("We couldn't save your photo. Check your connection and try again.");
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await removeProfilePhoto(userId);
    setBusy(false);
    if (ok) onDone("Profile photo removed");
    else setError("We couldn't remove your photo. Try again.");
  };

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={pick} />
      <input ref={library} type="file" accept="image/*" className="hidden" onChange={pick} />
    </>
  );

  if (photo) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Preview profile photo" className="absolute inset-0 z-50 flex flex-col bg-ink text-ink-foreground animate-fade-soft">
        {inputs}
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => setPhoto(null)} disabled={busy} className="text-base font-medium active:opacity-60">
            Cancel
          </button>
          <span className="text-base font-semibold">Preview</span>
          <span className="w-12" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <img
            src={photo.preview}
            alt="Your new profile photo"
            className="aspect-square w-full max-w-[18rem] rounded-full object-cover ring-2 ring-ink-foreground/80"
          />
          <p className="mt-6 text-center text-sm text-ink-foreground/70">This is how your photo will look on your profile.</p>
          {error && <p role="alert" className="mt-3 text-center text-sm text-destructive">{error}</p>}
        </div>
        <div className="space-y-3 px-5 pb-8">
          <button
            onClick={save}
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground active:opacity-80 disabled:opacity-60"
          >
            {busy ? <Spinner className="h-5 w-5" /> : "Save"}
          </button>
          <button
            onClick={() => library.current?.click()}
            disabled={busy}
            className="h-12 w-full rounded-full text-base font-semibold text-ink-foreground active:opacity-60"
          >
            Choose a different photo
          </button>
        </div>
      </div>
    );
  }

  const row = "flex h-14 w-full items-center gap-4 px-5 text-left text-base active:bg-muted disabled:opacity-50";
  return (
    <>
    {inputs}
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-overlay animate-fade-soft" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profile photo"
        onClick={(e) => e.stopPropagation()}
        className="rounded-t-2xl bg-card pb-6 pt-3 shadow-2xl animate-screen-in"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        <div className="flex flex-col items-center px-5 pb-4 pt-5">
          <MyPhoto className="h-20 w-20" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Profile photo</h2>
        </div>
        <div className="divide-y divide-border border-y border-border">
          <button className={`${row} text-foreground`} disabled={busy} onClick={() => camera.current?.click()}>
            <Camera className="h-5 w-5 text-brand" strokeWidth={2} /> Take photo
          </button>
          <button className={`${row} text-foreground`} disabled={busy} onClick={() => library.current?.click()}>
            <ImageIcon className="h-5 w-5 text-brand" strokeWidth={2} /> Choose from library
          </button>
          {url && (
            <button className={`${row} text-destructive`} disabled={busy} onClick={remove}>
              {busy ? <Spinner className="h-5 w-5" /> : <Trash2 className="h-5 w-5" strokeWidth={2} />} Remove photo
            </button>
          )}
        </div>
        {error && <p role="alert" className="px-5 pt-3 text-sm text-destructive">{error}</p>}
        <button onClick={onClose} className="mx-5 mt-4 h-12 w-[calc(100%-2.5rem)] rounded-full bg-muted text-base font-semibold text-foreground active:opacity-70">
          Cancel
        </button>
      </div>
    </div>
    </>
  );
}
