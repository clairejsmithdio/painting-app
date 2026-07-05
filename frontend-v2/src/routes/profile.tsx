import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getMyProfile, ensureMyProfile, updateMyProfile } from "@/lib/profiles";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Your profile — Palette" }] }),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = (await getMyProfile()) ?? (await ensureMyProfile());
      if (p) {
        setDisplayName(p.display_name);
        setBio(p.bio);
        setAvatar(p.avatar_url ?? "");
      }
    })();
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ display_name: displayName.trim() || "Artist", bio: bio.trim(), avatar_url: avatar.trim() || null });
      toast.success("Profile saved.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-navy">Your profile</h1>
          <div className="w-16" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <div className="card-elevated p-6 space-y-5">
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Display name</div>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60}
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
          </label>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Bio</div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
          </label>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Avatar URL</div>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…"
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
          </label>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </main>
    </div>
  );
}
