import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStagesProps {
  stages: string[];
  active: boolean;
  /** Approximate ms per stage. Last stage holds until active=false. */
  stageDuration?: number;
  title?: string;
  className?: string;
}

export function ProgressStages({
  stages,
  active,
  stageDuration = 1400,
  title,
  className,
}: ProgressStagesProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrent(0);
      return;
    }
    setCurrent(0);
    const id = setInterval(() => {
      setCurrent((c) => (c < stages.length - 1 ? c + 1 : c));
    }, stageDuration);
    return () => clearInterval(id);
  }, [active, stages.length, stageDuration]);

  if (!active) return null;

  return (
    <div className={cn("w-full max-w-sm", className)}>
      {title && (
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-navy">
          <Loader2 className="h-4 w-4 animate-spin text-coral" />
          {title}
        </div>
      )}
      {/* Progress bar */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-navy/10">
        <div
          className="h-full rounded-full bg-coral transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / stages.length) * 100}%` }}
        />
      </div>
      <ol className="space-y-2.5">
        {stages.map((s, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 flex-none items-center justify-center rounded-full transition",
                  done && "bg-navy text-white",
                  now && "bg-coral/15 text-coral ring-2 ring-coral/40",
                  !done && !now && "bg-navy/5 text-navy/40",
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : now ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "transition",
                  done && "text-navy/60 line-through decoration-navy/20",
                  now && "text-navy font-medium",
                  !done && !now && "text-navy/40",
                )}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
