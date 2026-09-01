import { ChevronRight, MessageCircle } from 'lucide-react';
import { contactInfo } from '@/data/content';

export default function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const waLink = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(
    'Olá! Gostaria de falar com um Atendente sobre os cursos da PHAROS.'
  )}`;

  return (
    <section id="inicio" className="relative flex min-h-[100svh] items-center overflow-hidden bg-noir">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/4653119/pexels-photo-4653119.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600"
          alt="Profissional de segurança em treinamento tático"
          className="h-full w-full object-cover object-center opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/85 to-noir/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/60" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* Decorative red accent */}
      <div className="absolute right-0 top-1/4 h-64 w-px bg-gradient-to-b from-transparent via-pharos-red/40 to-transparent" />
      <div className="absolute right-12 top-1/3 h-2 w-2 rounded-full bg-pharos-red" />

      <div className="container-x relative z-10 pt-20">
        <div className="max-w-2xl">
          <div className="hero-enter is-visible" style={{ transitionDelay: '0.1s' }}>
            <span className="section-label">
              <span className="h-px w-8 bg-pharos-red" />
              Segurança Privada em Goiás
            </span>
          </div>

          <h1
            className="hero-enter is-visible mt-5 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ transitionDelay: '0.25s' }}
          >
            Prepare-se para proteger.
            <br />
            <span className="text-pharos-red">Treine para liderar.</span>
          </h1>

          <p
            className="hero-enter is-visible mt-6 max-w-xl text-base leading-relaxed text-steel sm:text-lg"
            style={{ transitionDelay: '0.4s' }}
          >
            A PHAROS oferece formação, atualização e aperfeiçoamento para profissionais de
            segurança privada em Goiás. Cursos presenciais com instrutores qualificados e
            estrutura preparada para o mercado de trabalho.
          </p>

          <div
            className="hero-enter is-visible mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ transitionDelay: '0.55s' }}
          >
            <button onClick={() => scrollTo('#cursos')} className="btn-primary group">
              Conheça nossos cursos
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <MessageCircle className="h-4 w-4" />
              Fale com um Atendente
            </a>
          </div>

          {/* Trust badges */}
          <div
            className="hero-enter is-visible mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-wider text-steel"
            style={{ transitionDelay: '0.7s' }}
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pharos-red" />
              Formação reconhecida
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pharos-red" />
              Instrutores qualificados
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pharos-red" />
              Estrutura preparada
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
          <div className="h-2 w-1 animate-bounce rounded-full bg-pharos-red" />
        </div>
      </div>
    </section>
  );
}
