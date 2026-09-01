/**
 * ReviewCTA — seção de incentivo a avaliações Google.
 *
 * O QR Code é gerado via Google Charts API a partir de GOOGLE_REVIEW_URL.
 * Para alterar a URL, edite apenas src/config/site.ts → GOOGLE_REVIEW_URL.
 */
import { Star, QrCode as QrCodeIcon } from 'lucide-react';
import { GOOGLE_REVIEW_URL, googleReviewQrCodeUrl } from '@/config/site';

export default function ReviewCTA() {
  const qrUrl = googleReviewQrCodeUrl(180);

  return (
    <section className="relative border-t border-white/5 bg-graphite py-16 md:py-20">
      <div className="container-x">
        <div className="reveal mx-auto max-w-3xl rounded-2xl border border-pharos-red/20 bg-graphite-2/60 p-8 md:p-10">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">

            {/* QR Code */}
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white p-3">
                <img
                  src={qrUrl}
                  alt="QR Code para avaliação da PHAROS no Google"
                  width={180}
                  height={180}
                  className="block"
                  loading="lazy"
                />
              </div>
              <span className="flex items-center gap-1 text-xs text-steel">
                <QrCodeIcon className="h-3.5 w-3.5 text-pharos-red" />
                Aponte a câmera para avaliar
              </span>
            </div>

            {/* Texto */}
            <div className="text-center md:text-left">
              <div className="flex justify-center gap-1 md:justify-start">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-pharos-red text-pharos-red" />
                ))}
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-white">
                Gostou da sua experiência?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                Deixe sua avaliação no Google e ajude outras pessoas a conhecerem a PHAROS.
                Sua opinião é muito importante para nós e para quem está buscando uma formação
                de qualidade em segurança privada.
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6 inline-flex"
              >
                <Star className="h-4 w-4" />
                Avaliar a PHAROS no Google
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
