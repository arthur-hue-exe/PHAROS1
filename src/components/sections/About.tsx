import { useCountUp } from '@/hooks/useCountUp';
import { stats } from '@/data/content';
import { Shield, Target, Eye, MapPin } from 'lucide-react';

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const { ref, value } = useCountUp(stat.value);
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="text-center"
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="font-display text-4xl font-bold text-white sm:text-5xl">
        {value}
        <span className="text-pharos-red">{stat.suffix}</span>
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-steel">
        {stat.label}
      </div>
    </div>
  );
}

export default function About() {
  return (
    <section id="sobre" className="relative border-t border-white/5 bg-noir py-20 md:py-28">
      <div className="container-x">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="reveal reveal-left relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-noir flex items-center justify-center">
              <img
                src="/pharos-logo.png"
                alt="PHAROS — Escola de Vigilantes"
                className="aspect-[4/3] w-full object-contain p-8"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-transparent to-transparent" />
            </div>
            {/* Accent frame */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border border-pharos-red/20" />
            <div className="absolute -left-3 -top-3 h-12 w-12 border-l-2 border-t-2 border-pharos-red" />
          </div>

          {/* Text */}
          <div className="reveal reveal-right">
            <span className="section-label">
              <span className="h-px w-8 bg-pharos-red" />
              A Escola
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Sobre a PHAROS
            </h2>
            <p className="mt-5 text-base leading-relaxed text-steel">
              A PHAROS — Escola de Vigilantes é uma instituição especializada na
              <span className="text-white"> capacitação, atualização e aperfeiçoamento </span>
              de profissionais de segurança privada em Goiás. Oferecemos cursos presenciais e
              formações segmentadas, alinhadas às exigências legais e às necessidades reais do
              mercado.
            </p>
            <p className="mt-4 text-base leading-relaxed text-steel">
              Nossa missão é formar profissionais preparados para atuar com competência técnica,
              conduta ética e capacidade de resposta em situações de risco, contribuindo para a
              segurança da sociedade e o desenvolvimento dos profissionais do setor.
            </p>

            {/* Pillars */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-graphite/60 p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                <div>
                  <div className="text-sm font-semibold text-white">Missão</div>
                  <div className="mt-0.5 text-xs text-steel">Capacitar profissionais de segurança com excelência.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-graphite/60 p-4">
                <Eye className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                <div>
                  <div className="text-sm font-semibold text-white">Visão</div>
                  <div className="mt-0.5 text-xs text-steel">Ser referência em formação de segurança em Goiás.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-graphite/60 p-4">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                <div>
                  <div className="text-sm font-semibold text-white">Valores</div>
                  <div className="mt-0.5 text-xs text-steel">Disciplina, ética e compromisso técnico.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-graphite/60 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                <div>
                  <div className="text-sm font-semibold text-white">Atuação</div>
                  <div className="mt-0.5 text-xs text-steel">Goiânia e região metropolitana de Goiás.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="reveal-stagger mt-16 grid grid-cols-2 gap-8 rounded-2xl border border-white/10 bg-graphite/40 p-8 md:grid-cols-4 md:p-10">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
