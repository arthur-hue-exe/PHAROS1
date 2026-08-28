import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { galleryItems } from '@/data/content';

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % galleryItems.length)),
    []
  );
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + galleryItems.length) % galleryItems.length)),
    []
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIndex, close, next, prev]);

  return (
    <section id="estrutura" className="relative border-t border-white/5 bg-noir py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Infraestrutura
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Estrutura e Ambiente de Treinamento
          </h2>
          <p className="mt-4 text-steel">
            Espaços preparados para a formação prática e teórica de profissionais
            de segurança privada.
          </p>
        </div>

        <div className="reveal-stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setLightboxIndex(i)}
              className={`group relative overflow-hidden rounded-xl border border-white/10 ${
                i === 0 ? 'sm:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <img
                src={item.image}
                alt={item.alt}
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  i === 0 ? 'h-full min-h-[300px] lg:min-h-[400px]' : 'h-56'
                }`}
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-noir/90 via-noir/30 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-2 text-pharos-red">
                  <ZoomIn className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Ver imagem</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-steel">{item.description}</p>
              </div>
              {/* Always-visible label (low opacity) */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/80 to-transparent p-4 group-hover:opacity-0">
                <h3 className="font-display text-sm font-semibold text-white">{item.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-noir/95 backdrop-blur-md"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-pharos-red"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-pharos-red"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-pharos-red"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="mx-auto max-w-4xl px-8" onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryItems[lightboxIndex].image}
              alt={galleryItems[lightboxIndex].alt}
              className="animate-scale-in mx-auto max-h-[80vh] rounded-lg object-contain"
            />
            <div className="mt-4 text-center">
              <h3 className="font-display text-xl font-semibold text-white">
                {galleryItems[lightboxIndex].title}
              </h3>
              <p className="mt-1 text-sm text-steel">
                {galleryItems[lightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
