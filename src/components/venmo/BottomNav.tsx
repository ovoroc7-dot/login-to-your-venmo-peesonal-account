import { MyPhoto } from "./profilePhoto";
import { VenmoMark } from "./logos";

export type Tab = "Home" | "Cards" | "Pay/Request" | "Crypto" | "Me";

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const items: { name: Tab; icon: React.ReactNode }[] = [
    {
      name: "Home",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
          <path d="M11.3 2.6a1.1 1.1 0 0 1 1.4 0l8 6.6c.3.2.4.5.4.9V20a1.5 1.5 0 0 1-1.5 1.5H15v-6.2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6.2H4.4A1.5 1.5 0 0 1 2.9 20v-9.9c0-.4.1-.7.4-.9l8-6.6Z" />
        </svg>
      ),
    },
    {
      name: "Cards",
      icon: (
        <span className="relative block">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V9H3V7.5ZM3 11h18v5.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5V11Z" />
          </svg>
          <span className="absolute -right-1.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-badge" />
        </span>
      ),
    },
    { name: "Pay/Request", icon: null },
    {
      name: "Crypto",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9.6A3.4 3.4 0 1 0 14.8 14.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: "Me",
      icon: (
        <MyPhoto className="h-6 w-6" ring="ring-1 ring-brand/40" />
      ),
    },
  ];

  return (
    <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-3 pt-2">
      <ul className="grid grid-cols-5 items-end">
        {items.map((t) => (
          <li key={t.name} className="flex justify-center">
            {t.icon ? (
              <button
                onClick={() => onTab(t.name)}
                className={`flex flex-col items-center gap-1 text-[0.7rem] ${
                  tab === t.name ? "font-bold" : "font-medium"
                } ${t.name === "Me" && tab === "Me" ? "text-foreground" : "text-brand"}`}
              >
                <span className="text-brand">{t.icon}</span>
                {t.name}
              </button>
            ) : (
              <button
                onClick={() => onTab(t.name)}
                className="flex flex-col items-center gap-1 text-[0.7rem] font-medium text-brand"
              >
                <span className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-card bg-brand text-brand-foreground shadow-lg ring-1 ring-brand/20">
                  <VenmoMark className="h-6 w-6" />
                </span>
                Pay/Request
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
