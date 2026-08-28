import { timelineSteps } from '@/data/content';
import { useScrollProgress } from '@/hooks/useScroll';

export default function Timeline() {
  const progress = useScrollProgress();
  // Timeline fills based on scroll progress through the page
  const fillPercent = Math.min(Math.max((progress - 20) / 40, 0), 1) * 100;

  return (
    <section className="relative border-t border-white/5 bg-graphite py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Jornada
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Nossa Metodologia
          </h2>
          <p className="mt-4 text-steel">
            Do primeiro contato à certificação, uma jornada clara e estruturada
            para sua evolução profissional.
          </p>
        </div>

        {/* Timeline */}
        <div className="reveal mt-16 relative">
          {/* Track */}
          <div className="absolute left-0 right-0 top-[28px] hidden h-0.5 bg-white/10 md:block">
            <div
              className="h-full bg-pharos-red transition-[width] duration-100 ease-out"
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-5 md:gap-4">
            {timelineSteps.map((step, i) => (
              <div
                key={step.step}
                className="reveal"
                style={{
                  transitionDelay: `${i * 90}ms`,
                  ['--reveal-distance' as string]: '20px',
                }}
              >
                {/* Dot */}
                <div className="mb-6 flex justify-center md:mb-0 md:justify-start">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-graphite font-display text-lg font-bold text-white transition-all duration-300">
                    {step.step}
                  </div>
                </div>
                <div className="text-center md:text-left md:pl-2">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
