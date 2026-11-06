import { useEffect } from "react";
import { VenmoWordmark } from "./logos";

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-brand text-brand-foreground">
      <VenmoWordmark className="w-[42%] animate-fade-soft" />
    </div>
  );
}
