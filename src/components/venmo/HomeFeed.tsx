import { useEffect, useState } from "react";
import { Search, ScanQrCode, Heart, MessageCircle, MoreHorizontal, Globe, Users, Lock, Plus, Send, Landmark, X, ChevronRight } from "lucide-react";
import matthew from "@/assets/avatar-matthew.jpg";
import me from "@/assets/avatar-me.jpg";
import stacy from "@/assets/avatar-stacy.jpg";
import barbara from "@/assets/avatar-barbara.jpg";
import deposit from "@/assets/direct-deposit.jpg";
import promo from "@/assets/feed-promo.jpg";
import { VenmoMark } from "./logos";
import { formatMoney } from "./amount";
import { Avatar, people } from "./people";
import { MyPhoto } from "./profilePhoto";
import { ago, storyParts } from "./story";
import { inFeed, type Privacy, type Transaction } from "./wallet";

type Post = {
  id: string;
  avatar: React.ReactNode;
  actor: string;
  verb: "paid" | "charged";
  target: string;
  /** Signed amount shown only on your own payments, e.g. "- $5.00". */
  amount?: { sign: "+" | "-"; value: string };
  at: number;
  privacy: Privacy;
  note?: string | undefined;
  /** Wallet transaction id when it is one of your own payments (privacy can be changed). */
  txId?: string;
};

const DAY = 86_400_000;

const img = (src: string) => (
  <img src={src} alt="" width={512} height={512} loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
);

type Sample = Omit<Post, "at" | "avatar" | "verb"> & { avatar: string; days: number };

const samples: Sample[] = [
  { id: "s1", avatar: matthew, actor: "Matthew Prudhomme", target: "Michael Porter", days: 3, privacy: "Friends", note: "Forget it, Mike. It's Chinatown!" },
  { id: "s2", avatar: matthew, actor: "Matthew Prudhomme", target: "Michael Porter", days: 3.01, privacy: "Friends", note: "I propose a 3-team playoff for the future" },
  { id: "s3", avatar: me, actor: "You", target: "Chris Roszell", amount: { sign: "-", value: "595.00" }, days: 4, privacy: "Private", note: "🏠" },
  { id: "s4", avatar: me, actor: "You", target: "ISABEL FERRERA", amount: { sign: "-", value: "145.00" }, days: 6, privacy: "Private", note: "Thanks!" },
  { id: "s5", avatar: stacy, actor: "Stacy Lowe", target: "Katherine Reynolds", days: 9, privacy: "Public", note: "Thanks!" },
  { id: "s6", avatar: me, actor: "You", target: "ISABEL FERRERA", amount: { sign: "-", value: "145.00" }, days: 13, privacy: "Private", note: "Thanks!" },
  { id: "s7", avatar: barbara, actor: "Barbara Nace", target: "Allison Cowen", days: 14, privacy: "Public" },
];

/** Where the Venmo promo sits in the feed (just after the 3-day-old posts). */
const PROMO_DAYS = 3.5;

const emojiOnly = (s: string) => /^\p{Extended_Pictographic}+$/u.test(s);

function toPost(tx: Transaction): Post {
  const s = storyParts(tx);
  const person = people.find((p) => p.name === tx.counterparty) ?? { name: tx.counterparty, handle: "", kind: "silhouette" as const };
  return {
    id: tx.id,
    txId: tx.id,
    avatar: s.actor === "You" ? <MyPhoto /> : <Avatar person={person} />,
    actor: s.actor,
    verb: s.verb,
    target: s.target,
    amount: { sign: s.incoming ? "+" : "-", value: formatMoney(tx.cents) },
    at: new Date(tx.at).getTime(),
    privacy: tx.privacy ?? "Private",
    note: tx.note,
  };
}

function Actions({ liked, onLike, onMore }: { liked: boolean; onLike: () => void; onMore?: (() => void) | undefined }) {
  return (
    <div className="mt-3 flex items-center gap-5 text-muted-foreground">
      <button
        aria-label={liked ? "Unlike" : "Like"}
        aria-pressed={liked}
        onClick={onLike}
        className="flex items-center gap-1 active:scale-90"
      >
        <Heart className={`h-5 w-5 ${liked ? "fill-minus text-minus" : ""}`} strokeWidth={1.6} />
        {liked && <span className="text-xs text-minus">1</span>}
      </button>
      <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
      {onMore ? (
        <button aria-label="More options" onClick={onMore} className="ml-auto active:opacity-60">
          <MoreHorizontal className="h-5 w-5" strokeWidth={1.6} />
        </button>
      ) : (
        <MoreHorizontal className="ml-auto h-5 w-5" strokeWidth={1.6} />
      )}
    </div>
  );
}

function PostRow({
  p,
  now,
  liked,
  onLike,
  onMore,
}: {
  p: Post;
  now: number;
  liked: boolean;
  onLike: () => void;
  onMore?: (() => void) | undefined;
}) {
  return (
    <article className="flex gap-3 px-4 py-4" data-testid={p.txId ? "my-story" : undefined}>
      {p.avatar}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[0.95rem] leading-snug text-muted-foreground">
            <span className="text-foreground">{p.actor}</span> {p.verb} <span className="text-foreground">{p.target}</span>
          </p>
          {p.amount && (
            <span className={`shrink-0 text-[0.95rem] ${p.amount.sign === "+" ? "text-success" : "text-minus"}`}>
              {p.amount.sign} ${p.amount.value}
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {ago(new Date(p.at).toISOString(), now)}
          {p.privacy === "Private" ? (
            <>
              {" · Private transaction"} <Lock className="h-3 w-3 fill-current" strokeWidth={2} />
            </>
          ) : p.privacy === "Friends" ? (
            <Users className="h-3 w-3 fill-current" strokeWidth={2} aria-label="Friends" />
          ) : (
            <Globe className="h-3 w-3" strokeWidth={2} aria-label="Public" />
          )}
        </p>
        {p.note &&
          (emojiOnly(p.note) ? (
            <p className="mt-1.5 text-4xl leading-none">{p.note}</p>
          ) : (
            <p className="mt-1.5 text-[0.95rem] text-foreground">{p.note}</p>
          ))}
        <Actions liked={liked} onLike={onLike} onMore={onMore} />
      </div>
    </article>
  );
}

export type FirstSteps = { onAddMoney: () => void; onPay: () => void; onAddBank: () => void };

/** First things to do, shown on Home until a new account makes its first transaction. */
function GetStarted({ steps, onHide }: { steps: FirstSteps; onHide: () => void }) {
  const items = [
    { icon: Landmark, title: "Add a bank or card", body: "Link where your money comes from", onClick: steps.onAddBank },
    { icon: Plus, title: "Add money to Venmo", body: "Top up your Venmo balance", onClick: steps.onAddMoney },
    { icon: Send, title: "Pay or request a friend", body: "Find them by name, phone or email", onClick: steps.onPay },
  ];
  return (
    <section aria-label="Get started" className="mx-4 mt-4 rounded-2xl bg-brand/8 p-4">
      <div className="flex items-center">
        <h2 className="flex-1 text-[1.05rem] font-semibold text-foreground">Get started with Venmo</h2>
        <button aria-label="Hide get started" onClick={onHide} className="-mr-1 p-1 text-muted-foreground active:opacity-60">
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map(({ icon: Icon, title, body, onClick }) => (
          <li key={title}>
            <button
              onClick={onClick}
              className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-3 text-left active:opacity-70"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-medium text-foreground">{title}</span>
                <span className="block text-xs text-muted-foreground">{body}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeFeed({
  transactions = [],
  onEditPrivacy,
  firstSteps,
}: {
  transactions?: Transaction[];
  /** Shown to new accounts with no transactions yet. */
  firstSteps?: FirstSteps;
  /** Opens "Who can see this?" for one of your own payments. */
  onEditPrivacy?: (txId: string, privacy: Privacy) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [hideSteps, setHideSteps] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const mine = transactions.filter(inFeed).map(toPost);
  const sampled: Post[] = samples.map(({ days, avatar, ...s }) => ({ ...s, verb: "paid", avatar: s.actor === "You" ? <MyPhoto /> : img(avatar), at: now - days * DAY }));
  const all = [...mine, ...sampled].sort((a, b) => b.at - a.at);
  const promoAt = now - PROMO_DAYS * DAY;
  const before = all.filter((p) => p.at >= promoAt);
  const after = all.filter((p) => p.at < promoAt);

  const row = (p: Post) => (
    <PostRow
      key={p.id}
      p={p}
      now={now}
      liked={liked.has(p.id)}
      onLike={() =>
        setLiked((s) => {
          const n = new Set(s);
          if (n.has(p.id)) n.delete(p.id);
          else n.add(p.id);
          return n;
        })
      }
      onMore={p.txId ? () => onEditPrivacy?.(p.txId as string, p.privacy) : undefined}
    />
  );

  return (
    <div className="relative flex h-full flex-col animate-fade-soft">
      {/* search */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-muted px-4 text-muted-foreground">
          <Search className="h-5 w-5" strokeWidth={2} />
          <input
            placeholder="Find a person or business"
            className="w-full bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button aria-label="Scan QR code" className="p-1 text-foreground">
          <ScanQrCode className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {firstSteps && transactions.length === 0 && !hideSteps && (
          <GetStarted steps={firstSteps} onHide={() => setHideSteps(true)} />
        )}
        {/* direct deposit card */}
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex-1">
            <p className="text-[1.05rem] font-medium leading-snug text-foreground">
              Fast-forward payday. Get paid up to two days faster with Direct Deposit.
            </p>
            <button className="mt-3 rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-brand-foreground active:opacity-80">
              View account info
            </button>
          </div>
          <img
            src={deposit}
            alt=""
            width={768}
            height={768}
            className="h-28 w-28 shrink-0 object-contain mix-blend-multiply"
          />
        </div>

        <div className="mt-3 divide-y divide-border">
          {before.map(row)}

          {/* Venmo post */}
          <article className="flex gap-3 px-4 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center text-brand">
              <VenmoMark className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] text-foreground">Venmo</p>
              <img
                src={promo}
                alt=""
                width={1024}
                height={640}
                loading="lazy"
                className="mt-2 w-full rounded-xl object-cover"
              />
              <Actions
                liked={liked.has("promo")}
                onLike={() =>
                  setLiked((s) => {
                    const n = new Set(s);
                    if (n.has("promo")) n.delete("promo");
                    else n.add("promo");
                    return n;
                  })
                }
              />
            </div>
          </article>

          {after.map(row)}
        </div>
      </div>

    </div>
  );
}
