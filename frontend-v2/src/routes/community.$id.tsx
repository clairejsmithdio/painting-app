import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Send, Loader2 } from "lucide-react";
import {
  getArtwork,
  type ArtworkRow,
  getArtworkLikeCounts,
  getMyArtworkLikes,
  toggleArtworkLike,
  listComments,
  addComment,
  deleteComment,
  type CommentRow,
} from "@/lib/artworks";
import { getProfilesByUserIds, type Profile } from "@/lib/profiles";
import { setPaletteHint } from "@/lib/palette-apply-store";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community/$id")({
  component: BoardPage,
});

function BoardPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<ArtworkRow | null | undefined>(undefined);
  const [artist, setArtist] = useState<Profile | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commenters, setCommenters] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await getArtwork(id);
      setBoard(a);
      if (!a) return;
      const [profs, counts, mine, comm] = await Promise.all([
        getProfilesByUserIds([a.user_id]),
        getArtworkLikeCounts([a.id]),
        getMyArtworkLikes([a.id]),
        listComments(a.id),
      ]);
      setArtist(profs[a.user_id] ?? null);
      setLikeCount(counts[a.id] ?? 0);
      setLiked(mine.has(a.id));
      setComments(comm);
      const cids = Array.from(new Set(comm.map((c) => c.user_id)));
      setCommenters(await getProfilesByUserIds(cids));
    })().catch(() => setBoard(null));
  }, [id, user?.id]);

  const heart = async () => {
    if (!user) { toast.info("Sign in to love a board."); return; }
    if (!board) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try { await toggleArtworkLike(board.id, wasLiked); } catch (e) { toast.error((e as Error).message); }
  };

  const post = async () => {
    if (!board) return;
    if (!user) { toast.info("Sign in to comment."); return; }
    setPosting(true);
    try {
      const c = await addComment(board.id, text);
      setComments((prev) => [...prev, c]);
      setText("");
      const profs = await getProfilesByUserIds([c.user_id]);
      setCommenters((prev) => ({ ...prev, ...profs }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (c: CommentRow) => {
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    try { await deleteComment(c.id); } catch {}
  };

  const applyPalette = () => {
    if (!board) return;
    setPaletteHint({
      colors: board.palette.map((c) => c.hex),
      source: `artwork:${board.id}`,
      style: board.style ?? null,
    });
    toast.success("Palette ready — upload your image to apply it.");
    navigate({ to: "/" });
  };

  if (board === undefined) {
    return <div className="min-h-screen bg-canvas p-10"><div className="mx-auto max-w-5xl h-96 rounded-2xl shimmer" /></div>;
  }
  if (!board) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
        <div className="card-elevated p-10 text-center">
          <h1 className="font-display text-2xl text-navy">Board not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This board may have been removed or made private.</p>
          <Link to="/community" className="mt-4 inline-flex rounded-xl bg-navy px-4 py-2 text-sm text-white">Back to Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/community" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Community
          </Link>
          <button onClick={heart} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition", liked ? "bg-coral/10 text-coral" : "bg-white text-navy hover:bg-navy/5")}>
            <Heart className={cn("h-4 w-4", liked && "fill-coral")} /> {likeCount} {liked ? "Loved" : "Love this board"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        <div>
          <h1 className="font-display text-4xl text-navy">{board.title || "Untitled"}</h1>
          <div className="mt-2 text-sm text-muted-foreground">by {artist?.display_name || "Anonymous"}{board.style ? ` · ${board.style}` : ""}</div>
          {board.description && <p className="mt-4 max-w-2xl text-navy/80">{board.description}</p>}
          {board.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {board.tags.map((t) => (
                <span key={t} className="rounded-full bg-white px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-navy/70">{t}</span>
              ))}
            </div>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <ImagePanel label="Original" src={board.original_image_url} />
          <ImagePanel label="AI reimagined" src={board.final_image_url} />
          <ImagePanel label="Painted" src={board.painted_photo_url} />
        </section>

        {board.palette.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-navy mb-4">Palette & recipes</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {board.palette.map((c, i) => (
                <div key={i} className="card-elevated overflow-hidden">
                  <div className="h-24 w-full" style={{ backgroundColor: c.hex }} />
                  <div className="p-4">
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-navy">{c.hex.toUpperCase()}</div>
                      {c.percentage != null && <div className="text-xs text-muted-foreground">{Math.round(c.percentage)}%</div>}
                    </div>
                    {c.recipe && (
                      <div className="mt-3 space-y-1.5">
                        {c.recipe.pigments.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 text-xs">
                            <div className="h-4 w-4 rounded" style={{ backgroundColor: p.hex }} />
                            <span className="flex-1 truncate text-navy/80">{p.name}</span>
                            <span className="text-coral font-medium">{p.percentage}%</span>
                          </div>
                        ))}
                        {c.brand && <div className="pt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{c.brand}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={applyPalette}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition"
            >
              Apply this palette to my image
            </button>
          </section>
        )}

        <section>
          <h2 className="font-display text-2xl text-navy mb-4">Comments</h2>
          <div className="space-y-3">
            {comments.length === 0 && <div className="text-sm text-muted-foreground">Be the first to leave a note.</div>}
            {comments.map((c) => {
              const author = commenters[c.user_id];
              const mine = user?.id === c.user_id;
              return (
                <div key={c.id} className="card-elevated p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs font-semibold uppercase tracking-widest text-navy/70">
                      {author?.display_name || "Anonymous"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <p className="mt-2 text-sm text-navy/90 whitespace-pre-wrap">{c.content}</p>
                  {mine && (
                    <button onClick={() => remove(c)} className="mt-2 text-xs text-muted-foreground hover:text-destructive">
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={user ? "Add a comment…" : "Sign in to comment"}
              disabled={!user || posting}
              maxLength={2000}
              className="flex-1 rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40 disabled:opacity-60"
            />
            <button onClick={post} disabled={!user || posting || !text.trim()} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ImagePanel({ label, src }: { label: string; src: string | null }) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="px-4 pt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="aspect-square w-full bg-canvas">
        {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Not provided</div>
        )}
      </div>
    </div>
  );
}
