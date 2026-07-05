import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Compass, Heart } from "lucide-react";
import { listPublicArtworks, type ArtworkRow, getArtworkLikeCounts, getMyArtworkLikes, toggleArtworkLike } from "@/lib/artworks";
import { getProfilesByUserIds, type Profile } from "@/lib/profiles";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
  head: () => ({
    meta: [
      { title: "Community — Palette" },
      { name: "description", content: "Explore artboards from painters around the world." },
    ],
  }),
});

function CommunityPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ArtworkRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const list = await listPublicArtworks(90);
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

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="flex items-center gap-2 font-display text-xl text-navy">
            <Compass className="h-4 w-4 text-coral" /> Community
          </h1>
          <Link to="/inspire" className="text-sm text-navy/70 hover:text-navy">Inspire →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {rows === null ? (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="mb-6 h-72 rounded-2xl shimmer break-inside-avoid" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card-elevated p-10 text-center text-muted-foreground">
            No boards yet — share your first one from Visualise!
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
            {rows.map((a) => {
              const artist = profiles[a.user_id];
              const liked = myLikes.has(a.id);
              const primary = a.painted_photo_url || a.final_image_url || a.original_image_url;
              return (
                <div key={a.id} className="mb-6 break-inside-avoid card-elevated overflow-hidden">
                  <Link to="/community/$id" params={{ id: a.id }}>
                    {primary ? (
                      <img src={primary} alt={a.title || "Board"} className="w-full object-cover" />
                    ) : (
                      <div className="h-48 w-full bg-canvas" />
                    )}
                  </Link>
                  <div className="p-4">
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
                      <div className="mt-3 flex h-5 overflow-hidden rounded">
                        {a.palette.slice(0, 8).map((c, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                    )}
                    {a.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-wider text-navy/70">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
