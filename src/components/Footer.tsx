import { Mail, MapPin, Instagram, MessageCircle, Shield, Navigation } from 'lucide-react';
import Logo from './Logo';
import { contactInfo, navLinks, courses } from '@/data/content';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE, MAPS_LINK } from '@/config/site';
import { useRouter } from '@/context/RouterContext';

export default function Footer() {
  const { navigate } = useRouter();

  const handleNav = (href: string) => {
    navigate({ name: 'home' });
    setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleCourse = (slug: string) => {
    navigate({ name: 'course', slug });
  };

  // Número e mensagem centralizados em src/config/site.ts
  const waLink = whatsappLink(WHATSAPP_DEFAULT_MESSAGE);

  return (
    <footer className="border-t border-white/10 bg-noir">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-steel">
              Escola de formação e capacitação de profissionais de segurança privada em Goiás.
              Treine para proteger. Lidere com excelência.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-steel">
              <Shield className="h-4 w-4 text-pharos-red" />
              <span>Formação profissional reconhecida</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Navegação
            </h4>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleNav(link.href)}
                    className="text-sm text-steel transition-colors hover:text-pharos-red"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Course categories */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Cursos
            </h4>
            <ul className="mt-4 space-y-2.5">
              {courses.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleCourse(c.slug)}
                    className="text-left text-sm text-steel transition-colors hover:text-pharos-red"
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — endereço real via contactInfo (alimentado por site.ts) */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Contato
            </h4>
            <ul className="mt-4 space-y-3.5">
              {/* Endereço — fonte de verdade: src/config/site.ts → SITE_ADDRESS */}
              <li className="flex items-start gap-2.5 text-sm text-steel">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pharos-red" />
                <div>
                  <span>{contactInfo.address}</span>
                  <a
                    href={MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs text-pharos-red hover:text-white transition-colors"
                  >
                    <Navigation className="h-3 w-3" />
                    Ver no mapa
                  </a>
                </div>
              </li>

              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-start gap-2.5 text-sm text-steel transition-colors hover:text-pharos-red"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pharos-red" />
                  <span>{contactInfo.email}</span>
                </a>
              </li>

              <li>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-steel transition-colors hover:text-pharos-red"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-pharos-red" />
                  {/* Número exibido — fonte: src/config/site.ts → WHATSAPP_DISPLAY */}
                  <span>{contactInfo.whatsappDisplay}</span>
                </a>
              </li>

              <li className="text-sm text-steel">{contactInfo.hours}</li>
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-pharos-red hover:text-pharos-red"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={`https://instagram.com/${contactInfo.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-pharos-red hover:text-pharos-red"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-steel">
            © {new Date().getFullYear()} PHAROS — Escola de Vigilantes. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-5 text-xs text-steel">
            <button className="transition-colors hover:text-white">Termos de uso</button>
            <button className="transition-colors hover:text-white">Política de privacidade</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
