import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="animate-fade-up">
      <div className="mx-auto max-w-2xl text-center py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="font-display text-4xl text-navy">{title}</h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-navy">
          <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
          Coming soon
        </div>
      </div>
    </div>
  );
}
