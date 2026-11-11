import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Business photos live in the user's own folder of the private "avatars" bucket; signed links are cached per path. */
const cache = new Map<string, string>();

export function useStoredImage(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(path ? (cache.get(path) ?? null) : null);
  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const hit = cache.get(path);
    if (hit) {
      setUrl(hit);
      return;
    }
    let live = true;
    void supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 7)
      .then(({ data }) => {
        if (!data?.signedUrl) return;
        cache.set(path, data.signedUrl);
        if (live) setUrl(data.signedUrl);
      });
    return () => {
      live = false;
    };
  }, [path]);
  return url;
}

/** Center-crops a picked picture to width × height and shrinks it so uploads stay small. */
export async function prepareImage(file: File, width: number, height: number): Promise<Blob> {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = src;
    });
    const ratio = width / height;
    let sw = img.naturalWidth;
    let sh = sw / ratio;
    if (sh > img.naturalHeight) {
      sh = img.naturalHeight;
      sw = sh * ratio;
    }
    const scale = Math.min(1, width / sw);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.86),
    );
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Uploads a prepared picture and returns its storage path, or null when it fails. */
export async function uploadImage(userId: string, blob: Blob, kind: string): Promise<string | null> {
  const path = `${userId}/business-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
  if (error) return null;
  cache.set(path, URL.createObjectURL(blob));
  return path;
}

export function removeImages(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length) void supabase.storage.from("avatars").remove(list);
}

export type AccountInfo = { name: string; username: string; email: string; phone: string };

/** The personal account's name, username, email and phone, read once from the signed-in account. */
export function useAccountInfo(): AccountInfo {
  const [info, setInfo] = useState<AccountInfo>({ name: "", username: "", email: "", phone: "" });
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const m = (u.user_metadata ?? {}) as Record<string, unknown>;
      const email = u.email ?? "";
      const local = email.split("@")[0] ?? "";
      const name = typeof m["full_name"] === "string" && m["full_name"] ? m["full_name"] : local;
      const username = typeof m["username"] === "string" && m["username"] ? m["username"] : local;
      const phone = typeof m["phone"] === "string" ? m["phone"] : (u.phone ?? "");
      setInfo({ name, username, email, phone });
    });
  }, []);
  return info;
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length !== 10) return raw;
  return `1 (${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}
