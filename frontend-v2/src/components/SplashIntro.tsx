import { useEffect, useState } from "react";
import logoSrc from "@/assets/palette-logo-cropped.png";

interface Props {
  onEnter: (mode: "login" | "register") => void;
}

export function SplashIntro({ onEnter }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);  // start painting P
    const t2 = setTimeout(() => setPhase(2), 2200); // buttons in
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // The P occupies roughly the left 28% of the combined logo image.
  const P_WIDTH = 28;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-coral overflow-hidden">
      <div className="relative">
        {/* Static wordmark: full logo with the P region clipped away */}
        <img
          src={logoSrc}
          alt="Palette"
          className="h-28 sm:h-36 w-auto object-contain animate-fade-up"
          style={{ clipPath: `inset(0 0 0 ${P_WIDTH}%)` }}
        />
        {/* Painted P: same image stacked, revealing only the P left-to-right */}
        <img
          src={logoSrc}
          aria-hidden
          className="absolute inset-0 h-28 sm:h-36 w-auto object-contain"
          style={{
            clipPath:
              phase >= 1
                ? `inset(0 ${100 - P_WIDTH}% 0 0)`
                : "inset(0 100% 0 0)",
            transition: "clip-path 1400ms cubic-bezier(0.65,0,0.35,1)",
          }}
        />
      </div>

      <div
        className="mt-12 flex gap-3 transition-all duration-700"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
          pointerEvents: phase >= 2 ? "auto" : "none",
        }}
      >
        <button
          onClick={() => onEnter("login")}
          className="rounded-full bg-navy px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-navy/90"
        >
          Log in
        </button>
        <button
          onClick={() => onEnter("register")}
          className="rounded-full border border-navy/20 bg-white/80 backdrop-blur px-8 py-3 text-sm font-medium text-navy transition hover:bg-white"
        >
          Register
        </button>
      </div>
    </div>
  );
}
