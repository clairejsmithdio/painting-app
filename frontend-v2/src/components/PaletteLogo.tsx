export function PaletteLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      <path d="M14 8 h20 a18 18 0 0 1 0 36 H26 v28 h-12 z" fill="#FF6B4A" />
      <path d="M18 22 h18 a10 10 0 0 1 0 20 H26" fill="#1D3557" opacity="0.85" />
      <path d="M14 50 c8 4 14 -2 20 6" stroke="#06A77D" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
