interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
}

/**
 * PHAROS brand mark — a Spartan warrior helmet + shield silhouette in red/white/black.
 * Vector-built from the brand description (helmet, shield, red/white/black palette).
 */
export default function Logo({ className = '', variant = 'full' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="PHAROS">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1E24" />
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
        </defs>
        {/* Shield outline */}
        <path
          d="M24 4 L42 10 V26 Q42 38 24 45 Q6 38 6 26 V10 Z"
          fill="url(#shieldGrad)"
          stroke="#E10600"
          strokeWidth="2"
        />
        {/* Helmet crest */}
        <path d="M18 12 Q24 6 30 12 L30 16 L18 16 Z" fill="#E10600" />
        {/* Helmet face */}
        <path d="M17 15 L31 15 L31 28 Q31 34 24 37 Q17 34 17 28 Z" fill="#0A0A0A" stroke="#E10600" strokeWidth="1.5" />
        {/* Eye slit */}
        <rect x="20" y="20" width="8" height="2.5" rx="1" fill="#fff" />
        {/* Cheek guards */}
        <path d="M17 22 L14 26 L17 30" fill="none" stroke="#E10600" strokeWidth="1.5" />
        <path d="M31 22 L34 26 L31 30" fill="none" stroke="#E10600" strokeWidth="1.5" />
        {/* Shield base bar */}
        <rect x="16" y="39" width="16" height="2" rx="1" fill="#fff" />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" role="img" aria-label="PHAROS">
        <defs>
          <linearGradient id="shieldGradFull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1E24" />
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
        </defs>
        <path
          d="M24 4 L42 10 V26 Q42 38 24 45 Q6 38 6 26 V10 Z"
          fill="url(#shieldGradFull)"
          stroke="#E10600"
          strokeWidth="2"
        />
        <path d="M18 12 Q24 6 30 12 L30 16 L18 16 Z" fill="#E10600" />
        <path d="M17 15 L31 15 L31 28 Q31 34 24 37 Q17 34 17 28 Z" fill="#0A0A0A" stroke="#E10600" strokeWidth="1.5" />
        <rect x="20" y="20" width="8" height="2.5" rx="1" fill="#fff" />
        <path d="M17 22 L14 26 L17 30" fill="none" stroke="#E10600" strokeWidth="1.5" />
        <path d="M31 22 L34 26 L31 30" fill="none" stroke="#E10600" strokeWidth="1.5" />
        <rect x="16" y="39" width="16" height="2" rx="1" fill="#fff" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold uppercase tracking-wider text-white">
          Pharos
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-pharos-red">
          Escola de Vigilantes
        </span>
      </div>
    </div>
  );
}
