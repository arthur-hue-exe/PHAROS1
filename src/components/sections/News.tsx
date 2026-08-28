import { ArrowRight, Calendar } from 'lucide-react';
import { newsItems } from '@/data/content';

export default function News() {
  return (
    <section className="relative border-t border-white/5 bg-graphite py-20 md:py-28">
      <div className="container-x">
        <div className="reveal flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="section-label">
              <span className="h-px w-8 bg-pharos-red" />
              Atualidades
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Eventos e Novidades do Setor
            </h2>
            <p className="mt-4 text-steel">
              Acompanhe eventos, atualizações legislativas e novidades do mercado
              de segurança privada.
            </p>
          </div>
        </div>

        <div className="reveal-stagger mt-12 grid gap-5 md:grid-cols-2">
          {newsItems.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-graphite-2/60 transition-all duration-300 hover:border-pharos-red/40"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-2 via-transparent to-transparent" />
                {item.isPast && (
                  <span className="absolute right-3 top-3 rounded-full bg-noir/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-steel backdrop-blur-sm">
                    Evento realizado
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-xs text-steel">
                  <Calendar className="h-3.5 w-3.5 text-pharos-red" />
                  {item.dateLabel}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-steel">
                  {item.summary}
                </p>
                <button className="mt-5 flex items-center gap-1.5 text-sm font-medium text-pharos-red transition-colors hover:text-white">
                  Saiba mais
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Instagram placeholder */}
        <div className="reveal mt-10 rounded-2xl border border-white/10 bg-graphite-2/40 p-8 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-noir">
              <svg className="h-6 w-6 text-pharos-red" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">
              Siga a PHAROS no Instagram
            </h3>
            <p className="mt-2 text-sm text-steel">
              Eventos, novidades e atualizações do setor de segurança privada.
              Espaço preparado para integração com nosso Instagram.
            </p>
            <a
              href="https://instagram.com/pharos.escola"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-pharos-red hover:text-pharos-red"
            >
              @pharos.escola
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
