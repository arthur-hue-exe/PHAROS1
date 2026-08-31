interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
}

/**
 * PHAROS Logo — usa a imagem oficial (pharos-logo.png extraída do favicon.ico).
 * variant="mark"  → apenas o ícone circular (sem texto)
 * variant="full"  → ícone + nome + subtítulo (padrão)
 */
export default function Logo({ className = '', variant = 'full' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/pharos-logo.png"
        alt="PHAROS"
        className={`h-9 w-9 shrink-0 object-contain ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/pharos-logo.png"
        alt="PHAROS"
        className="h-9 w-9 shrink-0 object-contain"
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
