import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, LogIn, Sparkles, Palette as PaletteIcon, ImageIcon } from "lucide-react";
import { listPublicPalettes, type PaletteRow } from "@/lib/palettes";
import { listPublicArtworks, type ArtworkRow, getArtworkLikeCounts, getMyArtworkLikes, getPaletteLikeCounts, getMyPaletteLikes, togglePaletteLike, toggleArtworkLike } from "@/lib/artworks";
import { getProfilesByUserIds, type Profile } from "@/lib/profiles";
import { setPaletteHint } from "@/lib/palette-apply-store";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspire")({
  component: InspirePage,
  head: () => ({
    meta: [
      { title: "Inspire — Palette" },
      { name: "description", content: "Browse palettes and artwork from other artists — apply their palette to your own image." },
    ],
  }),
});

function InspirePage() {
  const [tab, setTab] = useState<"palettes" | "artwork">("palettes");
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="flex items-center gap-2 font-display text-xl text-navy">
            <Sparkles className="h-4 w-4 text-coral" /> Inspire
          </h1>
          <Link to="/community" className="text-sm text-navy/70 hover:text-navy">Community →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex gap-2">
          <TabBtn active={tab === "palettes"} onClick={() => setTab("palettes")}>
            <PaletteIcon className="h-4 w-4" /> Palettes
          </TabBtn>
          <TabBtn active={tab === "artwork"} onClick={() => setTab("artwork")}>
            <ImageIcon className="h-4 w-4" /> Artwork
          </TabBtn>
        </div>

        {tab === "palettes" ? <PalettesTab /> : <ArtworkTab />}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        active ? "bg-navy text-white" : "bg-white text-navy hover:bg-navy/5",
      )}
    >
      {children}
    </button>
  );
}

function PalettesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PaletteRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const list = await listPublicPalettes();
      setRows(list);
      const ids = list.map((r) => r.id);
      const [profs, cs, mine] = await Promise.all([
        getProfilesByUserIds(Array.from(new Set(list.map((r) => r.user_id)))),
        getPaletteLikeCounts(ids),
        getMyPaletteLikes(ids),
      ]);
      setProfiles(profs);
      setCounts(cs);
      setMyLikes(mine);
    })().catch(() => setRows([]));
  }, [user?.id]);

  const applyPalette = (p: PaletteRow) => {
    setPaletteHint({ colors: p.colors.map((c) => c.hex), source: `palette:${p.id}` });
    toast.success("Palette ready — upload your image to apply it.");
    navigate({ to: "/" });
  };

  const toggle = async (p: PaletteRow) => {
    if (!user) { toast.info("Sign in to love a palette."); return; }
    const liked = myLikes.has(p.id);
    setMyLikes((prev) => {
      const next = new Set(prev);
      liked ? next.delete(p.id) : next.add(p.id);
      return next;
    });
    setCounts((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + (liked ? -1 : 1) }));
    try { await togglePaletteLike(p.id, liked); } catch (e) { toast.error((e as Error).message); }
  };

  if (rows === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 rounded-2xl shimmer" />)}
      </div>
    );
  }
  if (rows.length === 0) return <div className="card-elevated p-10 text-center text-muted-foreground">No public palettes yet.</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((p) => {
        const artist = profiles[p.user_id];
        const liked = myLikes.has(p.id);
        return (
          <div key={p.id} className="card-elevated overflow-hidden flex flex-col">
            {p.image_data_url ? (
              <img src={p.image_data_url} alt={p.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-canvas" />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg text-navy truncate">{p.name}</h3>
                <button
                  onClick={() => toggle(p)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-coral"
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-coral text-coral")} />
                  {counts[p.id] ?? 0}
                </button>
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">
                by {artist?.display_name || "Anonymous"}
              </div>
              <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
                {p.colors.slice(0, 8).map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                ))}
              </div>
              <button
                onClick={() => applyPalette(p)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition"
              >
                Apply to my image
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArtworkTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ArtworkRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const list = await listPublicArtworks();
      setRows(list);
      const ids = list.map((r) => r.id);
      const [profs, cs, mine] = await Promise.all([
        getProfilesByUserIds(Array.from(new Set(list.map((r) => r.user_id)))),
        getArtworkLikeCounts(ids),
        getMyArtworkLikes(ids),
      ]);
      setProfiles(profs);
      setCounts(cs);
      setMyLikes(mine);
    })().catch(() => setRows([]));
  }, [user?.id]);

  const applyPalette = (a: ArtworkRow) => {
    setPaletteHint({
      colors: a.palette.map((c) => c.hex),
      source: `artwork:${a.id}`,
      style: a.style ?? null,
    });
    toast.success("Palette ready — upload your image to apply it.");
    navigate({ to: "/" });
  };

  const toggle = async (a: ArtworkRow) => {
    if (!user) { toast.info("Sign in to love a board."); return; }
    const liked = myLikes.has(a.id);
    setMyLikes((prev) => {
      const next = new Set(prev);
      liked ? next.delete(a.id) : next.add(a.id);
      return next;
    });
    setCounts((prev) => ({ ...prev, [a.id]: (prev[a.id] ?? 0) + (liked ? -1 : 1) }));
    try { await toggleArtworkLike(a.id, liked); } catch (e) { toast.error((e as Error).message); }
  };

  if (rows === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 rounded-2xl shimmer" />)}
      </div>
    );
  }
  if (rows.length === 0) return <div className="card-elevated p-10 text-center text-muted-foreground">No artwork shared yet.</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((a) => {
        const artist = profiles[a.user_id];
        const liked = myLikes.has(a.id);
        const thumb = a.final_image_url || a.painted_photo_url || a.original_image_url;
        return (
          <div key={a.id} className="card-elevated overflow-hidden flex flex-col">
            <Link to="/community/$id" params={{ id: a.id }} className="block">
              {thumb ? (
                <img src={thumb} alt={a.title || "Artwork"} className="h-56 w-full object-cover" />
              ) : (
                <div className="h-56 w-full bg-canvas" />
              )}
            </Link>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg text-navy truncate">{a.title || "Untitled"}</h3>
                <button onClick={() => toggle(a)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-coral">
                  <Heart className={cn("h-4 w-4", liked && "fill-coral text-coral")} />
                  {counts[a.id] ?? 0}
                </button>
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">
                by {artist?.display_name || "Anonymous"}{a.style ? ` · ${a.style}` : ""}
              </div>
              {a.palette.length > 0 && (
                <div className="mt-3 flex h-6 overflow-hidden rounded-lg">
                  {a.palette.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
                  ))}
                </div>
              )}
              <button
                onClick={() => applyPalette(a)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition"
              >
                Apply this palette to my image
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
