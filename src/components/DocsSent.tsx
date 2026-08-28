import { CheckCircle2, MessageCircle, Home } from 'lucide-react';
import { contactInfo } from '@/data/content';
import { useRouter } from '@/context/RouterContext';

export default function DocsSent() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-10">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />

          <h1 className="mt-5 font-display text-3xl font-bold text-white">
            Documentos enviados!
          </h1>
          <p className="mt-4 text-base leading-relaxed text-steel">
            Seus documentos foram recebidos com sucesso.{' '}
            <span className="font-semibold text-white">
              Entraremos em contato nas próximas 24 horas
            </span>{' '}
            para confirmar sua matrícula.
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-graphite-2/60 p-5 text-left">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-pharos-red">
              Próximos passos
            </h3>
            <ul className="mt-3 space-y-2.5">
              {[
                'Nossa equipe analisará sua documentação.',
                'Você receberá um contato via WhatsApp ou e-mail.',
                'Após aprovação, será orientado sobre data e horário de início.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-steel">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-xs font-bold text-pharos-red">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${contactInfo.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1"
            >
              <MessageCircle className="h-4 w-4" />
              Falar pelo WhatsApp
            </a>
            <button onClick={() => navigate({ name: 'home' })} className="btn-primary flex-1">
              <Home className="h-4 w-4" />
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
