import { useSyncExternalStore } from "react";
import me from "@/assets/avatar-me.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./people";

/**
 * The signed-in person's profile photo. The file lives in the private "avatars" bucket under
 * the user's own folder, and its path is kept on the account, so it follows them to every device.
 */
type State = {
  userId: string | null;
  url: string | null;
  /** Accounts made before photo upload existed keep their original built-in photo. */
  fallback: "photo" | "silhouette";
  loaded: boolean;
};

let state: State = { userId: null, url: null, fallback: "photo", loaded: false };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useProfilePhoto() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

const SIGNED_FOR = 60 * 60 * 24 * 7;

async function signedUrl(path: string) {
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, SIGNED_FOR);
  return data?.signedUrl ?? null;
}

export async function loadProfilePhoto(userId: string) {
  if (state.userId !== userId) set({ userId, url: null, loaded: false });
  const { data } = await supabase.auth.getUser();
  if (state.userId !== userId) return;
  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  const fallback = meta["full_name"] || "avatar_path" in meta ? "silhouette" : "photo";
  const path = typeof meta["avatar_path"] === "string" ? meta["avatar_path"] : null;
  const url = path ? await signedUrl(path) : null;
  if (state.userId !== userId) return;
  // Keep a photo that was just saved on this device if the account read is a moment behind.
  set({ url: url ?? (path ? state.url : null), fallback, loaded: true });
}

/** Center-crops the picked picture to a square and shrinks it so uploads stay small. */
export async function preparePhoto(file: File, size = 640): Promise<Blob> {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = src;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const out = Math.min(size, side);
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.88),
    );
  } finally {
    URL.revokeObjectURL(src);
  }
}

export async function saveProfilePhoto(userId: string, photo: Blob): Promise<boolean> {
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, photo, { contentType: "image/jpeg" });
  if (error) return false;
  const { data: current } = await supabase.auth.getUser();
  const old = (current.user?.user_metadata as Record<string, unknown> | undefined)?.["avatar_path"];
  const { error: saveError } = await supabase.auth.updateUser({ data: { avatar_path: path } });
  if (saveError) {
    await supabase.storage.from("avatars").remove([path]);
    return false;
  }
  if (typeof old === "string" && old !== path) void supabase.storage.from("avatars").remove([old]);
  const url = (await signedUrl(path)) ?? URL.createObjectURL(photo);
  set({ userId, url, loaded: true, fallback: "silhouette" });
  return true;
}

export async function removeProfilePhoto(userId: string): Promise<boolean> {
  const { data: current } = await supabase.auth.getUser();
  const old = (current.user?.user_metadata as Record<string, unknown> | undefined)?.["avatar_path"];
  const { error } = await supabase.auth.updateUser({ data: { avatar_path: null } });
  if (error) return false;
  if (typeof old === "string") void supabase.storage.from("avatars").remove([old]);
  set({ userId, url: null, loaded: true, fallback: "silhouette" });
  return true;
}

/** The signed-in person's picture, wherever "you" appear. */
export function MyPhoto({ className = "h-11 w-11", ring = "" }: { className?: string; ring?: string }) {
  const { url, fallback, loaded } = useProfilePhoto();
  if (url || (loaded && fallback === "photo")) {
    return (
      <img
        src={url ?? me}
        alt=""
        width={512}
        height={512}
        className={`${className} ${ring} shrink-0 rounded-full object-cover`}
      />
    );
  }
  if (!loaded) return <span className={`${className} ${ring} block shrink-0 rounded-full bg-muted`} />;
  return (
    <span className={`${ring} inline-flex shrink-0 rounded-full`}>
      <Avatar person={{ name: "You", handle: "", kind: "silhouette" }} className={className} />
    </span>
  );
}
