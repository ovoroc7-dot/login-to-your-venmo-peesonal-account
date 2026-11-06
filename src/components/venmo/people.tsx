import isabel from "@/assets/avatar-city.jpg";
import tyler from "@/assets/avatar-tyler.jpg";
import barbara from "@/assets/avatar-barbara.jpg";
import matthew from "@/assets/avatar-matthew.jpg";
import rob from "@/assets/avatar-rob.jpg";

export type Person = { name: string; handle: string; src?: string; kind?: "silhouette" | "phlearn" };

export const people: Person[] = [
  { name: "ISABEL FERRERA", handle: "@Isabel-Ferrera-1", src: isabel },
  { name: "tyler nace", handle: "@tyler-nace", src: tyler },
  { name: "Barbara Nace", handle: "@Barbara-Nace", src: barbara },
  { name: "Matthew Prudhomme", handle: "@Matthew-Prudhomme", src: matthew },
  { name: "Chris Roszell", handle: "@clroszell", kind: "silhouette" },
  { name: "Phlearn Llc", handle: "@Phlearn", kind: "phlearn" },
  { name: "Rob Swift", handle: "@Rob-Swift", src: rob },
];

export function Avatar({ person, className = "h-11 w-11" }: { person: Person; className?: string }) {
  if (person.src) {
    return (
      <img
        src={person.src}
        alt=""
        width={512}
        height={512}
        loading="lazy"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  if (person.kind === "phlearn") {
    return (
      <span
        className={`${className} flex shrink-0 items-center justify-center rounded-full bg-ink text-[0.45rem] font-black tracking-tight text-ink-foreground`}
      >
        PHLEARN
      </span>
    );
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted`}>
      <svg viewBox="0 0 44 44" className="h-full w-full text-border" fill="currentColor" aria-hidden>
        <circle cx="22" cy="17" r="8" />
        <path d="M6 40c2-8 9-12 16-12s14 4 16 12" />
      </svg>
    </span>
  );
}
