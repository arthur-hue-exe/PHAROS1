import { MessageCircle } from 'lucide-react';
import { contactInfo } from '@/data/content';

export default function WhatsAppButton() {
  const link = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(
    'Olá! Gostaria de informações sobre os cursos da PHAROS.'
  )}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 md:right-6"
      aria-label="Falar pelo WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366]" style={{ animation: 'pulse-ring 2.5s ease-out infinite' }} />
      <MessageCircle className="relative h-7 w-7" />
    </a>
  );
}
