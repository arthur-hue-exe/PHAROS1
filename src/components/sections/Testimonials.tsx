import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { testimonials } from '@/data/content';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  const count = testimonials.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  return (
    <section id="depoimentos" className="relative border-t border-white/5 bg-noir py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Depoimentos
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            O que dizem nossos alunos
          </h2>
          <p className="mt-4 text-steel">
            Profissionais que passaram pela PHAROS compartilham suas experiências.
          </p>
        </div>

        <div
          className="reveal mt-12 relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {testimonials.map((t) => (
              <div key={t.id} className="w-full shrink-0 px-4">
                <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-graphite-2/60 p-8 text-center md:p-12">
                  <Quote className="mx-auto h-10 w-10 text-pharos-red/40" />
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-pharos-red text-pharos-red" />
                    ))}
                  </div>
                  <p className="mt-5 text-lg leading-relaxed text-white md:text-xl">
                    "{t.text}"
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-pharos-red/40 bg-noir font-display text-sm font-bold text-pharos-red">
                      {t.initials}
                    </div>
                    <div className="text-left">
                      <div className="font-display text-base font-semibold text-white">
                        {t.name}
                      </div>
                      <div className="text-xs text-steel">{t.role}</div>
                    </div>
                  </div>
                  {t.isDemo && (
                    <div className="mt-4 text-[10px] uppercase tracking-wider text-steel/50">
                      Depoimento demonstrativo
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-noir/80 text-white backdrop-blur-sm transition-colors hover:border-pharos-red hover:bg-pharos-red"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-noir/80 text-white backdrop-blur-sm transition-colors hover:border-pharos-red hover:bg-pharos-red"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-pharos-red' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ir para depoimento ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
