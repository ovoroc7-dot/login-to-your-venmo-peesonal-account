import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEdgeColors } from "@/hooks/useEdgeColors";
import { Splash } from "@/components/venmo/Splash";
import { Welcome } from "@/components/venmo/Welcome";
import { Login } from "@/components/venmo/Login";
import { SignUp } from "@/components/venmo/SignUp";
import { Home } from "@/components/venmo/Home";
import { SignedOut } from "@/components/venmo/SignedOut";
import { Spinner } from "@/components/venmo/logos";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Venmo — Pay your people" },
      {
        name: "description",
        content: "Send to friends. Pay the rent. Split the bill. Make your next move with Venmo.",
      },
      { property: "og:title", content: "Venmo — Pay your people" },
      {
        property: "og:description",
        content: "Send to friends. Pay the rent. Split the bill. Make your next move with Venmo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Step = "splash" | "welcome" | "signedOut" | "login" | "signup" | "loading" | "home";

function Index() {
  const [step, setStep] = useState<Step>("splash");
  const [entry, setEntry] = useState<"welcome" | "signedOut">("welcome");
  /** undefined while checking for a saved sign-in, null when nobody is signed in on this device. */
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  const screen = useRef<HTMLDivElement>(null);
  // The status bar and gesture bar areas take the color of whatever screen is showing.
  const edges = useEdgeColors(screen, "#008CFF");

  // Stay signed in on this device until the user signs out themselves.
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) setUserId(session.user.id);
      if (event === "SIGNED_OUT") {
        setUserId(null);
        setEntry("signedOut");
        setStep((s) => (s === "home" || s === "loading" ? "signedOut" : s));
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (step !== "splash" || !splashDone || userId === undefined) return;
    setStep(userId ? "home" : "welcome");
  }, [step, splashDone, userId]);

  const signOut = () => {
    setEntry("signedOut");
    setStep("signedOut");
    setUserId(null);
    void supabase.auth.signOut();
  };

  const afterLogin = (id: string) => {
    setUserId(id);
    setStep("loading");
    setTimeout(() => setStep("home"), 1500);
  };

  return (
    <main className="app-shell" style={{ backgroundColor: edges.top }}>
      <div aria-hidden className="app-edge app-edge-top" style={{ backgroundColor: edges.top }} />
      <div aria-hidden className="app-edge app-edge-bottom" style={{ backgroundColor: edges.bottom }} />
      <div ref={screen} className="app-screen">
      {step === "splash" && <Splash onDone={finishSplash} />}
      {step === "welcome" && <Welcome onLogin={() => setStep("login")} onSignUp={() => setStep("signup")} />}
      {step === "signedOut" && (
        <SignedOut onLogin={() => setStep("login")} onCreate={() => setStep("signup")} />
      )}
      {step === "login" && <Login onClose={() => setStep(entry)} onSuccess={afterLogin} />}
      {step === "signup" && (
        <SignUp onClose={() => setStep(entry)} onSuccess={afterLogin} onLogin={() => setStep("login")} />
      )}
      {step === "loading" && (
        <div className="flex h-full items-center justify-center text-subtle">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {step === "home" && userId && <Home key={userId} userId={userId} onSignOut={signOut} />}
      </div>
    </main>
  );
}
