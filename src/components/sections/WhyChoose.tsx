import {
  ShieldCheck, UserCheck, Building2, RefreshCw, TrendingUp, type LucideIcon,
} from 'lucide-react';
import { differentiators } from '@/data/content';

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  UserCheck,
  Building2,
  RefreshCw,
  TrendingUp,
};

export default function WhyChoose() {
  return (
    <section className="relative border-t border-white/5 bg-graphite py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Diferenciais
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Por que escolher a PHAROS?
          </h2>
          <p className="mt-4 text-steel">
            Uma instituição pensada para formar profissionais de segurança privada
            com excelência técnica e compromisso com o mercado.
          </p>
        </div>

        <div className="reveal-stagger mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {differentiators.map((item) => {
            const Icon = iconMap[item.icon] ?? ShieldCheck;
            return (
              <div
                key={item.title}
                className="group rounded-xl border border-white/10 bg-graphite-2/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-pharos-red/60 hover:shadow-[0_8px_32px_-8px_rgba(225,6,0,0.25)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-noir text-pharos-red transition-colors duration-300 group-hover:border-pharos-red/40 group-hover:bg-pharos-red/10">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
