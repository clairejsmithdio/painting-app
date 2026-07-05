import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe, Lock, LogIn } from "lucide-react";
import { listPublicPalettes, listMyPalettes, type PaletteRow } from "@/lib/palettes";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Library — Palette" },
      { name: "description", content: "Browse public palettes and manage your saved palettes." },
    ],
  }),
});

function LibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"public" | "mine">("public");
  const [publicPalettes, setPublic] = useState<PaletteRow[] | null>(null);
  const [mine, setMine] = useState<PaletteRow[] | null>(null);

  useEffect(() => {
    listPublicPalettes().then(setPublic).catch(() => setPublic([]));
  }, []);
  useEffect(() => {
    if (user) listMyPalettes().then(setMine).catch(() => setMine([]));
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const active = tab === "mine" ? mine : publicPalettes;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-navy">Library</h1>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <button onClick={signOut} className="text-sm text-navy/70 hover:text-navy">Sign out</button>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm text-navy/70 hover:text-navy">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex gap-2">
          <TabBtn active={tab === "public"} onClick={() => setTab("public")}>
            <Globe className="h-4 w-4" /> Public
          </TabBtn>
          <TabBtn active={tab === "mine"} onClick={() => setTab("mine")}>
            <Lock className="h-4 w-4" /> My palettes
          </TabBtn>
        </div>

        {tab === "mine" && !user ? (
          <div className="card-elevated p-10 text-center">
            <p className="text-navy/80">Sign in to view your saved palettes.</p>
            <Link
              to="/auth"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </div>
        ) : active === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl shimmer" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="card-elevated p-10 text-center text-muted-foreground">
            {tab === "mine" ? "You haven't saved any palettes yet." : "No public palettes yet — be the first!"}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((p) => <PaletteCard key={p.id} palette={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "bg-navy text-white" : "bg-white text-navy hover:bg-navy/5"
      }`}
    >
      {children}
    </button>
  );
}

function PaletteCard({ palette }: { palette: PaletteRow }) {
  return (
    <div className="card-elevated overflow-hidden">
      {palette.image_data_url ? (
        <img src={palette.image_data_url} alt={palette.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-canvas" />
      )}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg text-navy truncate">{palette.name}</h3>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {palette.is_public ? "Public" : "Private"}
          </span>
        </div>
        <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
          {palette.colors.slice(0, 8).map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
          ))}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{palette.colors.length} colours</div>
      </div>
    </div>
  );
}
