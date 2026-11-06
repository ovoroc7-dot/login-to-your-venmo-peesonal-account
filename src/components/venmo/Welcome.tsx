import friend from "@/assets/avatar-friend.jpg";
import couple from "@/assets/avatar-couple.jpg";

export function Welcome({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col bg-brand px-6 pb-8 pt-5 text-brand-foreground animate-fade-soft">
      {/* page indicator */}
      <div className="flex justify-end gap-1" aria-hidden>
        <span className="h-1 w-5 rounded-full bg-brand-foreground" />
        <span className="h-1 w-1 rounded-full bg-brand-foreground/50" />
        <span className="h-1 w-1 rounded-full bg-brand-foreground/50" />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-[4.6rem] font-semibold leading-[0.95] tracking-display">
          <span className="block">Pay</span>
          <span className="flex items-center gap-2">
            <img
              src={friend}
              alt=""
              width={512}
              height={512}
              className="h-12 w-12 rounded-full border-2 border-bubble object-cover"
            />
            your
            <svg viewBox="0 0 40 24" className="ml-1 h-6 w-10 self-center" fill="none" aria-hidden>
              <path
                d="M2 6c12-4 24-2 32 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path d="M28 17l6 2 1-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex items-center gap-2">
            people
            <span className="flex items-center gap-1 rounded-full bg-bubble/70 py-1 pl-1 pr-2">
              <img
                src={couple}
                alt=""
                width={512}
                height={512}
                className="h-11 w-11 rounded-full object-cover"
              />
              <span className="text-3xl leading-none">💗</span>
            </span>
          </span>
        </h1>
        <p className="mt-8 max-w-[18rem] text-[1.05rem] font-medium leading-snug">
          Send to friends. Pay the rent. Split the bill. Make your next move with Venmo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onLogin}
          className="h-14 rounded-full bg-ink text-base font-semibold text-ink-foreground transition active:opacity-70"
        >
          Log in
        </button>
        <button
          type="button"
          className="h-14 rounded-full bg-brand-foreground text-base font-semibold text-foreground transition active:opacity-70"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
