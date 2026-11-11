/** Venmo business profile rules: names, usernames, categories, tips and the fee a business pays on money it receives. */
import type { Ledger, PendingRequest, Wallet } from "./wallet";

export type BusinessProfile = {
  name: string;
  /** Without the leading @. */
  username: string;
  about: string;
  category: string;
  subcategory: string;
  /** Storage paths in the user's own folder, or null for the default picture. */
  photoPath: string | null;
  coverPath: string | null;
  contactInstructions: string;
  gallery: string[];
  tipsOn: boolean;
  /** Three tip choices, in percent. */
  tips: number[];
  createdAt: string;
};

/** A business profile has its own balance, requests and history, separate from the personal account. */
export type Business = { profile: BusinessProfile; ledger: Ledger };

export const ABOUT_MAX = 155;
export const DEFAULT_TIPS = [15, 20, 25];
export const GALLERY_MAX = 6;

/** Fee a business pays on each payment of $1.00 or more it receives: 1.9% + $0.10 (rounded to the cent). */
export function businessFee(cents: number): number {
  if (cents < 100) return 0;
  return Math.round(cents * 0.019) + 10;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export const NAME_HINT = "Your business name needs to be different from your personal one.";
export const USERNAME_RULE =
  "Your username should start with a letter and contain only letters, numbers, hyphen(-), and underscore(_) characters. It must be 5-30 characters long.";

/** Error message for a business name, or null when it can be used. */
export function businessNameError(name: string, personalName: string): string | null {
  if (!name.trim()) return NAME_HINT;
  if (personalName.trim() && norm(name) === norm(personalName)) return NAME_HINT;
  if (name.trim().length > 50) return "Your business name can be up to 50 characters.";
  return null;
}

/** Error message for a business username (with or without @), or null when it can be used. */
export function businessUsernameError(username: string, personalUsername: string): string | null {
  const u = username.trim().replace(/^@/, "");
  if (!/^[A-Za-z][A-Za-z0-9_-]{4,29}$/.test(u)) return USERNAME_RULE;
  if (personalUsername && u.toLowerCase() === personalUsername.replace(/^@/, "").toLowerCase()) {
    return "Your business username needs to be different from your personal one.";
  }
  return null;
}

/** A tip choice must be a whole percent from 1 to 100. */
export function tipError(value: string): string | null {
  const n = Number(value);
  if (!/^\d{1,3}$/.test(value.trim()) || !Number.isInteger(n) || n < 1 || n > 100) return "Enter 1% to 100%";
  return null;
}

/** Tip in cents for a percent of an amount. */
export function tipCents(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}

/** Custom tips can't exceed $1,000 or 5x the original amount, whichever is smaller. */
export function maxCustomTip(cents: number): number {
  return Math.min(100_000, cents * 5);
}

/** Outgoing business requests whose customer should have paid by `now`. */
export function businessDue(wallet: Wallet, now: number): PendingRequest[] {
  return (wallet.business?.ledger.requests ?? []).filter(
    (r) => r.direction === "outgoing" && r.respondAt !== undefined && new Date(r.respondAt).getTime() <= now,
  );
}

export const CATEGORIES: { name: string; subs: string[] }[] = [
  {
    name: "Arts and Entertainment",
    subs: ["Artists and Performers", "Event Tickets", "Movie Theaters", "Music and Recording", "Photography", "Recreation and Sports"],
  },
  { name: "Association or Club", subs: ["Clubs and Fraternal Organizations", "Membership Organizations", "Religious Organizations", "Sports Clubs and Leagues"] },
  { name: "Commercial Equipment and Electronics", subs: ["Computer Hardware", "Electronics Repair", "Electronics Stores", "Industrial Supplies"] },
  { name: "Education and Membership", subs: ["Schools and Tutoring", "Childcare", "Classes and Lessons", "Colleges and Universities"] },
  { name: "Food and Drink", subs: ["Bakeries", "Bars", "Catering", "Coffee and Tea", "Food Trucks", "Restaurants"] },
  { name: "Health and Wellness", subs: ["Fitness and Gyms", "Massage", "Medical Practitioners", "Spas", "Yoga and Pilates"] },
  { name: "Home and Repair", subs: ["Cleaning Services", "Contractors", "Electricians", "Landscaping", "Plumbing", "Moving and Storage"] },
  { name: "Personal Services", subs: ["Barbers and Salons", "Beauty", "Dog Walking and Pet Care", "Laundry", "Tattoo and Piercing"] },
  {
    name: "Professional Services",
    subs: [
      "Accounting, Auditing, and Bookkeeping Services",
      "Advertising Services",
      "Architectural, Engineering, and Surveying Services",
      "Business Services",
      "Commercial Photography, Art, and Graphics",
      "Computer Programming, Data Processing, and Integrated Systems Design Services",
      "Consulting Services",
      "Direct Marketing",
      "Employment Agencies and Temporary Help Services",
      "Legal Services",
      "Website Design",
    ],
  },
  { name: "Real Estate and Travel", subs: ["Hotels and Lodging", "Property Management", "Real Estate Agents", "Travel Agencies", "Vacation Rentals"] },
  { name: "Retail", subs: ["Clothing and Accessories", "Florists", "Gifts and Crafts", "Grocery", "Jewelry", "Online Store"] },
  { name: "Transportation", subs: ["Auto Repair", "Car Wash", "Delivery", "Rideshare and Taxi"] },
];
