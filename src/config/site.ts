/**
 * src/config/site.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Configurações centralizadas do PHAROS.
 * Para alterar WhatsApp, endereço ou qualquer dado institucional,
 * edite APENAS este arquivo — não há referências espalhadas pelo projeto.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── Contato ───────────────────────────────────────────────────────────────────

/** Número no formato internacional sem espaços ou sinais (para wa.me/). */
export const WHATSAPP_NUMBER = '5562996790101';

/** Exibição formatada para o usuário. */
export const WHATSAPP_DISPLAY = '(62) 99679-0101';

/**
 * Mensagem padrão quando o usuário acessa via botão flutuante ou
 * hero sem contexto de curso específico.
 */
export const WHATSAPP_DEFAULT_MESSAGE =
  'Olá! Vim pelo site do PHAROS e tenho interesse em saber mais sobre os cursos e as opções disponíveis.';

/**
 * Gera a mensagem contextual quando o usuário está na página de um curso.
 * @param courseTitle Título do curso exibido na página atual.
 */
export function whatsappCourseMessage(courseTitle: string): string {
  return `Olá! Vim pelo site do PHAROS e tenho interesse em saber mais sobre o curso de ${courseTitle}.`;
}

/**
 * Gera o link completo do WhatsApp.
 * @param message Mensagem pré-preenchida. Se omitida, usa a mensagem padrão.
 */
export function whatsappLink(message?: string): string {
  const text = encodeURIComponent(message ?? WHATSAPP_DEFAULT_MESSAGE);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

// ── Endereço ──────────────────────────────────────────────────────────────────

/** Endereço oficial completo (rodapé, seção de contato, etc.). */
export const SITE_ADDRESS =
  'R. Dez - Parque Santa Cecilia, Aparecida de Goiânia - GO, 74919-335, Brasil';

/** Query usada para abrir o Google Maps. */
export const MAPS_QUERY =
  'R. Dez, Parque Santa Cecilia, Aparecida de Goiânia, GO, 74919-335';

/** Link direto para o Google Maps. */
export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

/** URL do embed para iframe do mapa. */
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;

// ── Identidade ────────────────────────────────────────────────────────────────

export const SITE_NAME = 'PHAROS';
export const SITE_FULL_NAME = 'PHAROS — Escola de Vigilantes';
export const SITE_EMAIL = 'Secretaria@pharosescoladevigilante.com.br';
export const SITE_INSTAGRAM = 'pharos.escola';
export const SITE_HOURS = 'Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h';

// ── Avaliações Google ────────────────────────────────────────────────────────
/**
 * URL da página de avaliações no Google.
 * Quando disponível, substitua pela URL direta do Google Meu Negócio da PHAROS.
 * Esta constante é usada no QR Code da seção de avaliações e no botão "Avaliar".
 *
 * Para obter a URL correta:
 *   1. Acesse Google Meu Negócio → Sua Empresa → Obter mais avaliações
 *   2. Copie o link curto gerado pelo Google
 *   3. Substitua o valor abaixo
 */
export const GOOGLE_REVIEW_URL = 'https://share.google/UTuBNGw4SlN2IJyLW';

/**
 * URL da API do Google Charts para gerar QR Code da página de avaliações.
 * Gerado automaticamente a partir de GOOGLE_REVIEW_URL.
 */
export function googleReviewQrCodeUrl(size = 200): string {
  return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(GOOGLE_REVIEW_URL)}&choe=UTF-8`;
}
