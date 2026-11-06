type P = { className?: string };

/** PayPal USD (PYUSD) mark: white double-bar P on a black coin. */
export function PyusdMark({ className }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="PayPal USD">
      <circle cx="20" cy="20" r="20" fill="var(--color-ink)" />
      <path
        d="M14 30V10h8.2a6 6 0 0 1 0 12H17.5"
        fill="none"
        stroke="var(--color-ink-foreground)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M11 17.5h16M11 21.5h11" stroke="var(--color-ink-foreground)" strokeWidth="1.6" />
    </svg>
  );
}

export function StellarMark({ className }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Stellar">
      <circle cx="20" cy="20" r="20" fill="var(--color-card)" />
      <g fill="none" stroke="var(--color-subtle)" strokeWidth="2" strokeLinecap="round">
        <path d="M28.5 12.5A10 10 0 0 0 11 21" />
        <path d="M11.5 27.5A10 10 0 0 0 29 19" />
        <path d="M8 24.5 32 13" />
        <path d="M8 28.5 32 17" />
      </g>
    </svg>
  );
}

export function ArbitrumMark({ className }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Arbitrum">
      <circle cx="20" cy="20" r="20" fill="var(--color-ink)" />
      <circle cx="20" cy="20" r="16" fill="var(--color-arb)" />
      <path
        d="m20 9 9.5 5.5v11L20 31l-9.5-5.5v-11Z"
        fill="none"
        stroke="var(--color-ink-foreground)"
        strokeWidth="1.6"
      />
      <path d="m17 26 5-12M21 26l4-9" stroke="var(--color-ink-foreground)" strokeWidth="2" />
    </svg>
  );
}

export function EthereumMark({ className }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Ethereum">
      <circle cx="20" cy="20" r="20" fill="var(--color-ink)" />
      <path d="M20 7 12 20.5l8 4.6 8-4.6Z" fill="var(--color-ink-foreground)" />
      <path d="m12 22.4 8 11 8-11-8 4.7Z" fill="var(--color-ink-foreground)" opacity="0.8" />
    </svg>
  );
}

export function SolanaMark({ className }: P) {
  return (
    <span className={`flex items-center justify-center rounded-full bg-ink ${className ?? ""}`} aria-label="Solana" role="img">
      <span className="flex w-1/2 flex-col gap-[14%]">
        <span className="h-[3px] w-full -skew-x-[30deg] bg-sol" />
        <span className="h-[3px] w-full skew-x-[30deg] bg-sol" />
        <span className="h-[3px] w-full -skew-x-[30deg] bg-sol" />
      </span>
    </span>
  );
}
