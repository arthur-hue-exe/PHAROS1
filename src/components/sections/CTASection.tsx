import { ChevronRight, MessageCircle } from 'lucide-react';
import { contactInfo } from '@/data/content';
import { useRouter } from '@/context/RouterContext';

export default function CTASection() {
  const { navigate } = useRouter();
  const waLink = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(
    'Olá! Quero falar com a PHAROS sobre matrícula.'
  )}`;

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-noir py-20 md:py-28">
      {/* Decorative geometry */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-pharos-red via-pharos-red/30 to-transparent" />
      <div className="absolute right-0 bottom-0 h-full w-1 bg-gradient-to-t from-pharos-red via-pharos-red/30 to-transparent" />
      <div className="absolute right-1/4 top-10 h-32 w-32 rounded-full border border-pharos-red/10" />
      <div className="absolute left-1/4 bottom-10 h-20 w-20 rounded-full border border-pharos-red/10" />

      <div className="container-x relative z-10">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Matrículas Abertas
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            Sua próxima evolução profissional
            <br />
            <span className="text-pharos-red">começa aqui.</span>
          </h2>
          <p className="mt-5 text-base text-steel sm:text-lg">
            Junte-se aos profissionais que escolheram a PHAROS para sua formação
            em segurança privada. Matrículas abertas para todas as modalidades.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => {
                navigate({ name: 'home' });
                setTimeout(() => document.querySelector('#cursos')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="btn-primary group"
            >
              Ver cursos
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <MessageCircle className="h-4 w-4" />
              Falar com a PHAROS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
