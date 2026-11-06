import { useRef, useState, type ReactNode } from "react";
import { Heart, User, Zap } from "lucide-react";
import teen from "@/assets/teen-card.jpg";
import { VenmoMark } from "./logos";

function DollarDot() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[0.6rem] font-bold leading-none text-card">
      $
    </span>
  );
}

const iconCls = "h-4 w-4 fill-current text-foreground";

type Slide = {
  key: string;
  card: ReactNode;
  title: string;
  points: { icon: ReactNode; text: string }[];
  cta: string;
  terms: boolean;
};

const slides: Slide[] = [
  {
    key: "credit",
    card: (
      <div className="relative h-full w-full rounded-xl bg-qr p-3 text-brand-foreground shadow-md">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <VenmoMark className="h-4 w-4" />
          <span className="opacity-80">Credit</span>
        </span>
        <span className="absolute bottom-2.5 right-3 text-2xl font-black italic tracking-tight">VISA</span>
      </div>
    ),
    title: "Earn unlimited cash back with the Venmo Credit Card",
    points: [
      { icon: <DollarDot />, text: "Earn up to 3% automatic cash back" },
      { icon: <User className={iconCls} strokeWidth={2} />, text: "No impact to credit score if declined" },
      { icon: <Heart className={iconCls} strokeWidth={2} />, text: "Easily split purchases in the app" },
    ],
    cta: "Apply now",
    terms: true,
  },
  {
    key: "debit",
    card: (
      <div className="relative h-full w-full rounded-xl bg-holo p-3 text-brand-foreground shadow-md">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <VenmoMark className="h-4 w-4" />
          <span className="opacity-80">Debit</span>
        </span>
        <span className="absolute bottom-3 right-3 flex">
          <span className="h-6 w-6 rounded-full bg-mc-red" />
          <span className="-ml-2.5 h-6 w-6 rounded-full bg-mc-orange opacity-90" />
        </span>
      </div>
    ),
    title: "Spend your balance instantly with the Venmo Debit Card",
    points: [
      { icon: <DollarDot />, text: "No monthly fees or minimum balance" },
      { icon: <Zap className={iconCls} strokeWidth={2} />, text: "Earn up to 5% cashback at top brands" },
      { icon: <Heart className={iconCls} strokeWidth={2} />, text: "Easily split purchases in the app" },
    ],
    cta: "Get the Venmo Debit Card",
    terms: true,
  },
  {
    key: "teen",
    card: (
      <img
        src={teen}
        alt="Teen holding a Venmo debit card"
        width={1024}
        height={640}
        className="h-full w-full rounded-xl object-cover shadow-md"
      />
    ),
    title: "Get the best of Venmo for ages 13 to 17",
    points: [
      { icon: <VenmoMark className="h-3.5 w-3.5 text-foreground" />, text: "Easily track your teen's spending" },
      { icon: <User className={iconCls} strokeWidth={2} />, text: "Access built-in parental controls" },
      { icon: <Heart className={iconCls} strokeWidth={2} />, text: "Allow them to spend with a debit card" },
    ],
    cta: "Create a teen account",
    terms: false,
  },
];

export function CardsScreen() {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + 12;
    setActive(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / step))));
  };

  return (
    <div className="h-full overflow-y-auto pb-28 pt-6 animate-fade-soft">
      <h1 className="px-4 text-lg font-medium text-foreground">Cards</h1>

      <div className="@container relative mt-5">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4"
        >
          {slides.map((s, i) => (
            <section key={s.key} className="w-[88%] shrink-0 snap-start">
              <div className="aspect-[1.6/1] w-full">{s.card}</div>
              <div
                className={`pt-10 transition-opacity duration-200 ${i === active ? "opacity-100" : "opacity-0"}`}
              >
                <h2 className="text-2xl leading-tight text-foreground/90">{s.title}</h2>
                <ul className="mt-6 space-y-4">
                  {s.points.map((p) => (
                    <li key={p.text} className="flex items-center gap-4 text-sm text-subtle">
                      <span className="flex w-4 justify-center">{p.icon}</span>
                      {p.text}
                    </li>
                  ))}
                </ul>
                <button className="mt-5 h-10 w-full rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-sm active:opacity-80">
                  {s.cta}
                </button>
                {s.terms && <p className="mt-3 text-center text-xs text-subtle">Terms apply</p>}
              </div>
            </section>
          ))}
        </div>

        {/* page dots */}
        <div className="pointer-events-none absolute inset-x-0 top-[calc((100cqw-2rem)*0.88/1.6+0.9rem)] flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === active ? "bg-brand" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
