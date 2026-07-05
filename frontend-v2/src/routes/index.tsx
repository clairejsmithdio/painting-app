import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Palette as PaletteIcon, BookMarked, Compass, Eye, UserCircle2, LogIn } from "lucide-react";
import logoSrc from "@/assets/palette-logo-cropped.png";
import { SplashIntro } from "@/components/SplashIntro";
import { VisualiseTab } from "@/components/tabs/VisualiseTab";
import { MixTab } from "@/components/tabs/MixTab";
import { useAuth } from "@/lib/use-auth";
import { peekPaletteHint } from "@/lib/palette-apply-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

type TabId = "visualise" | "mix";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "visualise", label: "Visualise", icon: Eye },
  { id: "mix", label: "Mix", icon: PaletteIcon },
];

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("visualise");
  const [showSplash, setShowSplash] = useState(false);
  const hint = peekPaletteHint();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("palette-splash-seen")) {
      setShowSplash(true);
    }
  }, []);

  const dismissSplash = (_mode: "login" | "register") => {
    sessionStorage.setItem("palette-splash-seen", "1");
    setShowSplash(false);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {showSplash && <SplashIntro onEnter={dismissSplash} />}
      <header className="sticky top-0 z-30 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <img
              src={logoSrc}
              alt="Palette"
              className="h-20 w-auto object-contain"
            />
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Visualise · Mix · Create
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <button
                onClick={() => navigate({ to: "/profile" })}
                className="inline-flex items-center gap-1.5 text-navy/70 hover:text-navy"
              >
                <UserCircle2 className="h-4 w-4" /> Profile
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="inline-flex items-center gap-1.5 text-navy/70 hover:text-navy"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </button>
            )}
          </div>
        </div>

        <nav className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap",
                    active
                      ? "bg-navy text-white shadow-sm"
                      : "text-navy/70 hover:bg-navy/5 hover:text-navy",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
            <NavPill onClick={() => navigate({ to: "/inspire" })} icon={Sparkles} label="Inspire" />
            <NavPill onClick={() => navigate({ to: "/library" })} icon={BookMarked} label="Library" />
            <NavPill onClick={() => navigate({ to: "/community" })} icon={Compass} label="Community" />
          </div>
        </nav>
      </header>

      {hint && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-coral/30 bg-coral/5 p-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-6 overflow-hidden rounded">
                {hint.colors.slice(0, 8).map((c, i) => <div key={i} className="w-4" style={{ backgroundColor: c }} />)}
              </div>
              <span className="text-navy/80">
                Palette ready to apply{hint.style ? ` · ${hint.style}` : ""} — upload an image below.
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "visualise" && <VisualiseTab />}
        {tab === "mix" && <MixTab />}
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Palette. Made for painters.
      </footer>
    </div>
  );
}

function NavPill({ onClick, icon: Icon, label }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-navy/70 hover:bg-navy/5 hover:text-navy transition"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

