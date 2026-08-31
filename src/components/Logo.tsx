interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
}

export default function Logo({ className = '', variant = 'full' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/pharos-logo.png"
        alt="PHAROS"
        className={`h-12 w-12 shrink-0 object-contain drop-shadow-lg ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/pharos-logo.png"
        alt="PHAROS"
        className="h-12 w-12 shrink-0 object-contain drop-shadow-lg"
        draggable={false}
      />
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
