interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
}

/**
 * PHAROS Logo oficial — escudo espartano com texto PHAROS.
 * A imagem já contém o texto "PHAROS", por isso o variant="full"
 * exibe apenas a imagem sem duplicar o texto ao lado.
 */
export default function Logo({ className = '', variant = 'full' }: LogoProps) {
  if (variant === 'mark') {
    // Ícone isolado (sem texto lateral) — usado onde o espaço é restrito
    return (
      <img
        src="/pharos-logo.png"
        alt="PHAROS"
        className={`h-12 w-12 shrink-0 object-contain drop-shadow-lg ${className}`}
        draggable={false}
      />
    );
  }

  // Variant "full": imagem maior, sem texto duplicado (o logo já tem "PHAROS" gravado)
  return (
    <img
      src="/pharos-logo.png"
      alt="PHAROS — Escola de Vigilantes"
      className={`h-14 w-auto shrink-0 object-contain drop-shadow-lg ${className}`}
      draggable={false}
    />
  );
}
