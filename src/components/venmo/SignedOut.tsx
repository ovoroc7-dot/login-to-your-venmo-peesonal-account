import illustration from "@/assets/signed-out-illustration.jpg";
import { VenmoMark } from "./logos";

/** Screen shown right after "Sign Out of Venmo" in Settings. */
export function SignedOut({ onLogin, onCreate }: { onLogin: () => void; onCreate?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col bg-screen px-4 pb-6 animate-fade-soft">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 mx-auto aspect-[2/3] max-h-full max-w-full">
          <img
            src={illustration}
            alt="A hand holding up a phone showing the Venmo app"
            width={768}
            height={1152}
            className="h-full w-full object-contain mix-blend-multiply"
          />
          <VenmoMark className="absolute left-[48.6%] top-[43.5%] h-[11%] w-[12%] -translate-x-1/2 -translate-y-1/2 -skew-x-6 text-brand-foreground" />
        </div>
      </div>

      <div className="mt-4 flex shrink-0 flex-col gap-3">
        <button
          type="button"
          onClick={onCreate}
          className="h-12 rounded-full bg-brand text-base font-bold text-brand-foreground transition active:opacity-80"
        >
          Create account
        </button>
        <button
          type="button"
          onClick={onLogin}
          className="h-12 rounded-full border border-border bg-card text-base font-bold text-brand transition active:bg-muted"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
