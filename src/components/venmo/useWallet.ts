import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { EMPTY_WALLET, applyTransaction, newTxId, parseWallet, type Transaction, type Wallet } from "./wallet";

/**
 * The signed-in user's Venmo balance, history and requests, kept in their account so every device shows the same wallet.
 * Loads when the account opens, saves every change, and picks up changes from other devices when the app comes back into view.
 */
export function useWallet(userId: string) {
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<Wallet>(EMPTY_WALLET);
  /** True while a local change has not been saved yet, so a refresh never overwrites it. */
  const dirty = useRef(false);
  const saving = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);

  const fetchWallet = useCallback(async (): Promise<Wallet | null> => {
    const { data, error } = await supabase.from("wallets").select("data").eq("user_id", userId).maybeSingle();
    if (error) return null;
    if (data) return parseWallet(JSON.stringify(data.data));
    const fresh = parseWallet(null);
    const { error: insertError } = await supabase
      .from("wallets")
      .insert({ user_id: userId, data: fresh as unknown as Json });
    if (insertError) {
      // Another device may have created it at the same moment: read theirs.
      const again = await supabase.from("wallets").select("data").eq("user_id", userId).maybeSingle();
      return again.data ? parseWallet(JSON.stringify(again.data.data)) : null;
    }
    return fresh;
  }, [userId]);

  // First load; keeps retrying quietly when the connection drops, and never saves over the account before it has loaded.
  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    setLoaded(false);
    const load = async () => {
      const w = await fetchWallet();
      if (cancelled) return;
      if (!w) {
        retry = setTimeout(load, 3000);
        return;
      }
      latest.current = w;
      setWallet(w);
      setLoaded(true);
    };
    void load();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
    };
  }, [fetchWallet]);

  // Pick up changes made on another phone or computer when this one comes back into view.
  useEffect(() => {
    if (!loaded) return;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || dirty.current || pending.current > 0) return;
      const w = await fetchWallet();
      if (!w || dirty.current || pending.current > 0) return;
      latest.current = w;
      setWallet(w);
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    const poll = setInterval(refresh, 30_000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      clearInterval(poll);
    };
  }, [loaded, fetchWallet]);

  // Save every local change, in order, always sending the newest wallet.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    latest.current = wallet;
    dirty.current = false;
    pending.current += 1;
    saving.current = saving.current.then(async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await supabase
          .from("wallets")
          .upsert({ user_id: userId, data: latest.current as unknown as Json });
        if (!error) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      pending.current -= 1;
    });
  }, [wallet, loaded, userId]);

  /** Runs any wallet rule from wallet.ts (requests, privacy changes) against the latest state. */
  const update = useCallback((change: (w: Wallet) => Wallet) => {
    setWallet((w) => {
      const next = change(w);
      if (next !== w) dirty.current = true;
      return next;
    });
  }, []);

  const record = useCallback(
    (tx: Omit<Transaction, "id" | "at">) =>
      update((w) => applyTransaction(w, { ...tx, id: newTxId(), at: new Date().toISOString() })),
    [update],
  );

  return { wallet, record, update, loaded };
}
