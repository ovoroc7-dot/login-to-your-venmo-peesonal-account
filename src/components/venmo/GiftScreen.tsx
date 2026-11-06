import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import doordash from "@/assets/gift/doordash.svg.asset.json";
import starbucks from "@/assets/gift/starbucks.svg.asset.json";
import sephora from "@/assets/gift/sephora.svg.asset.json";
import chipotle from "@/assets/gift/chipotle.svg.asset.json";
import lululemon from "@/assets/gift/lululemon.svg.asset.json";
import ulta from "@/assets/gift/ulta.svg.asset.json";
import target from "@/assets/gift/target.svg.asset.json";
import uber from "@/assets/gift/uber.svg.asset.json";
import tjmaxx from "@/assets/gift/tjmaxx.svg.asset.json";
import marshalls from "@/assets/gift/marshalls.svg.asset.json";
import homegoods from "@/assets/gift/homegoods.png.asset.json";
import justFurYou from "@/assets/gift-just-fur-you.jpg";
import pawtyTime from "@/assets/gift-pawty-time.jpg";
import thanks from "@/assets/gift-thanks.jpg";
import partyMonster from "@/assets/gift-party-monster.jpg";

type Brand = { name: string; range: string; tile: React.ReactNode };

const logo = (src: string, className: string) => <img src={src} alt="" className={className} loading="lazy" />;

const brands: Brand[] = [
  {
    name: "DoorDash",
    range: "$15 - $100",
    tile: <span className="flex h-full items-center justify-center bg-card px-2">{logo(doordash.url, "w-full")}</span>,
  },
  {
    name: "Starbucks",
    range: "$5 - $100",
    tile: <span className="flex h-full items-center justify-center bg-card p-1.5">{logo(starbucks.url, "h-full")}</span>,
  },
  {
    name: "Sephora",
    range: "$15 - $100",
    tile: (
      <span className="flex h-full flex-col justify-between bg-card">
        {[0, 1, 2].map((i) => (
          <span key={`t${i}`} className="h-[11%] bg-ink" />
        ))}
        <span className="flex h-[12%] items-center justify-center px-6">{logo(sephora.url, "h-full")}</span>
        {[0, 1, 2].map((i) => (
          <span key={`b${i}`} className="h-[11%] bg-ink" />
        ))}
      </span>
    ),
  },
  {
    name: "Chipotle",
    range: "$10 - $100",
    tile: <span className="flex h-full items-center justify-center bg-card p-1">{logo(chipotle.url, "h-full")}</span>,
  },
  {
    name: "Lululemon",
    range: "$25 - $100",
    tile: <span className="flex h-full items-center justify-center bg-lulu">{logo(lululemon.url, "h-[125%] max-w-none")}</span>,
  },
  {
    name: "Ulta Beauty",
    range: "$15 - $100",
    tile: (
      <span className="flex h-full items-center justify-center bg-ulta px-2">
        {logo(ulta.url, "w-full brightness-0 invert")}
      </span>
    ),
  },
  {
    name: "Target",
    range: "",
    tile: (
      <span className="flex h-full flex-col items-center justify-center gap-1 bg-card">
        {logo(target.url, "h-1/2")}
        <span className="text-[0.7rem] font-black tracking-tight text-target">TARGET.</span>
      </span>
    ),
  },
  {
    name: "TJX Multi",
    range: "",
    tile: (
      <span className="grid h-full grid-cols-2 place-items-center gap-1 bg-card p-1.5">
        {logo(tjmaxx.url, "w-full")}
        <span className="text-[0.45rem] font-bold tracking-wide text-ulta">SIERRA</span>
        {logo(marshalls.url, "w-full")}
        {logo(homegoods.url, "w-full")}
      </span>
    ),
  },
  {
    name: "Uber",
    range: "",
    tile: <span className="flex h-full items-center justify-center bg-ink px-3">{logo(uber.url, "w-full invert")}</span>,
  },
];

const designs = [
  { label: "Thank You", src: justFurYou },
  { label: "Birthday", src: pawtyTime },
  { label: "Thank You", src: thanks },
  { label: "Thank You", src: partyMonster },
];

export function GiftScreen({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [kind, setKind] = useState<"card" | "cash">("card");

  return (
    <div className="flex h-full flex-col bg-card animate-push-in">
      <header className="flex h-12 shrink-0 items-center justify-between px-2">
        <button aria-label="Back" onClick={onBack} className="p-2 text-subtle active:opacity-60">
          <ChevronLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <button aria-label="Close" onClick={onClose} className="p-2 text-subtle active:opacity-60">
          <X className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </header>

      <h1 className="px-4 text-center text-[1.35rem] leading-snug text-foreground/85">
        What type of gift do you want to send?
      </h1>

      <div className="mx-4 mt-4 grid shrink-0 grid-cols-2 rounded-full bg-muted p-0.5" role="tablist">
        {(["card", "cash"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`h-9 rounded-full text-sm transition-colors ${
              kind === k ? "border border-border bg-card text-foreground/85 shadow-sm" : "text-subtle"
            }`}
          >
            {k === "card" ? "Gift card" : "Cash"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-4 pb-8">
        {kind === "card" ? (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 animate-fade-soft">
            {brands.map((b) => (
              <li key={b.name}>
                <button className="w-full text-left active:opacity-70">
                  <span className="block aspect-square overflow-hidden rounded-md border border-border">{b.tile}</span>
                  <span className="mt-1.5 block text-sm text-foreground/80">{b.name}</span>
                  {b.range && <span className="block text-xs text-subtle">{b.range}</span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="animate-fade-soft">
            <p className="text-xs leading-snug text-foreground/75">
              Make your payment special for any occasion, big or small. Choose a design for a preview.
            </p>
            <ul className="mt-3 space-y-3">
              {designs.map((d) => (
                <li key={d.src}>
                  <button className="relative block w-full overflow-hidden rounded-lg active:opacity-80">
                    <img src={d.src} alt="" width={1280} height={800} loading="lazy" className="block w-full" />
                    <span className="absolute left-2 top-2 rounded-md border border-border bg-card px-2 py-0.5 text-[0.65rem] text-foreground/80">
                      {d.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
