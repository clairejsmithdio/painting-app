import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeMap = {
    sm: { width: 32, height: 32, icon: 28 },
    md: { width: 48, height: 48, icon: 44 },
    lg: { width: 64, height: 64, icon: 60 },
  };

  const dims = sizeMap[size];
  const textSizeClass = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3">
      <svg
        width={dims.width}
        height={dims.height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="paletteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6B4A" />
            <stop offset="20%" stopColor="#FF6B4A" />
            <stop offset="35%" stopColor="#E63946" />
            <stop offset="50%" stopColor="#9D4EDD" />
            <stop offset="65%" stopColor="#3A86FF" />
            <stop offset="80%" stopColor="#06A77D" />
            <stop offset="100%" stopColor="#06A77D" />
          </linearGradient>
        </defs>

        {/* Main P shape made of curved strokes */}
        <g>
          {/* Vertical stem */}
          <rect
            x="12"
            y="8"
            width="6"
            height="32"
            rx="3"
            fill="url(#paletteGradient)"
          />

          {/* Top curved bowl */}
          <path
            d="M 18 10 Q 28 10 28 18 Q 28 26 20 26 L 18 26"
            stroke="url(#paletteGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Decorative paint strokes */}
          <path
            d="M 12 32 Q 20 34 28 32"
            stroke="url(#paletteGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-display font-bold ${textSizeClass[size]} text-palette-navy-dark`}>
            Palette
          </h1>
          {size === 'lg' && (
            <p className="text-xs text-palette-teal font-medium tracking-wide">
              Visualise. Mix. Create.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
