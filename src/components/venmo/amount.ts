/** Keeps a typed amount to digits with at most one "." and two decimals. */
export function cleanAmount(raw: string): string {
  let out = "";
  let dot = false;
  let decimals = 0;
  for (const ch of raw.replace(",", ".")) {
    if (ch === ".") {
      if (dot) continue;
      dot = true;
      out += out === "" ? "0." : ".";
    } else if (ch >= "0" && ch <= "9") {
      if (dot) {
        if (decimals >= 2) continue;
        decimals++;
      } else if (out === "0") {
        out = "";
      }
      out += ch;
    }
  }
  return out.slice(0, 9);
}

/** Converts a typed amount like "2.5" to whole cents (250). */
export function toCents(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

/** Formats cents as dollars with two decimals, e.g. 1050 → "10.50". */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** A bank transfer must be more than $0 and no more than the Venmo balance (both in cents). */
export function canTransfer(cents: number, balance: number): boolean {
  return cents > 0 && cents <= balance;
}

/** Groups the dollars of a typed amount with commas, keeping any typed decimals: "4999.5" → "4,999.5". */
export function groupTyped(value: string): string {
  const [whole = "", dec] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? grouped : `${grouped || "0"}.${dec}`;
}

/** Formats cents as grouped dollars with two decimals, e.g. 2189403 → "21,894.03". */
export function formatMoney(cents: number): string {
  return groupTyped(formatCents(cents));
}

/** A single bank transfer can be at most $4,999.99. */
export const TRANSFER_LIMIT_CENTS = 499999;

/** True when one bank transfer request is over the $4,999.99 limit. */
export function overTransferLimit(cents: number): boolean {
  return cents > TRANSFER_LIMIT_CENTS;
}

/** Instant transfer fee: 1.75% of the amount, at least $0.25 and at most $25.00 (all in cents). */
export function instantFee(cents: number): number {
  if (cents <= 0) return 0;
  return Math.min(2500, Math.max(25, Math.round(cents * 0.0175)));
}

/** Adds business days (skipping Saturday and Sunday) to a date. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

/** Formats a date like "Tuesday, Feb 10th". */
export function formatArrival(d: Date): string {
  const n = d.getDate();
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${month} ${n}${suffix}`;
}

/** A standard bank transfer is estimated to arrive within 3 business days. */
export function standardTransferArrival(from: Date): string {
  return formatArrival(addBusinessDays(from, 3));
}

/** True when the amount is more than $0. */
export function hasAmount(value: string): boolean {
  return Number(value) > 0;
}
