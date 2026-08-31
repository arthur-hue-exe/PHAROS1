import { createClient } from '@supabase/supabase-js';

// ── Leitura das variáveis de ambiente ─────────────────────────────────────────
// Vite expõe apenas variáveis com prefixo VITE_ para o bundle do browser.
// Prefixos como NEXT_PUBLIC_ ou ausência de prefixo resultam em `undefined`.

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

// ── Validação — avisa no console em dev mas NÃO lança exceção ─────────────────
// Lançar erro aqui mata o módulo inteiro: EDGE_BASE não é exportado,
// AdminContext quebra na importação e o crash aparece como "erro de rede".
// Em vez disso, logamos o problema e deixamos o sistema tentar — as chamadas
// de API vão falhar individualmente com mensagens específicas.

const missingUrl = !supabaseUrl || supabaseUrl === 'undefined';
const missingKey = !supabaseAnonKey || supabaseAnonKey === 'undefined';

if (missingUrl || missingKey) {
  const missing = [
    missingUrl && 'VITE_SUPABASE_URL',
    missingKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ');

  const msg =
    `[PHAROS] Variável(is) de ambiente ausente(s): ${missing}.\n` +
    'Verifique o arquivo .env.local (dev) ou as variáveis de ambiente na Vercel/KingHost (produção).\n' +
    'Prefixo obrigatório para Vite: VITE_  (não NEXT_PUBLIC_, não sem prefixo).\n' +
    'Exemplo: VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '         VITE_SUPABASE_ANON_KEY=eyJhbGciOi...';

  console.error(msg);
  // Em produção não expomos o detalhe técnico ao usuário — só logamos.
}

// ── Flags exportadas para que componentes possam exibir erro adequado ─────────
export const SUPABASE_CONFIGURED = !missingUrl && !missingKey;

// ── Cliente Supabase (singleton) ──────────────────────────────────────────────
// Criado mesmo com strings vazias para evitar crashes em cascata.
// Requisições falharão individualmente com mensagens tratáveis.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ── Base URL das Edge Functions ───────────────────────────────────────────────
export const EDGE_BASE = supabaseUrl
  ? `${supabaseUrl}/functions/v1`
  : '';

// ── Helpers de diagnóstico (apenas dev) ──────────────────────────────────────
if (import.meta.env.DEV && SUPABASE_CONFIGURED) {
  const projectId = supabaseUrl.replace(/https?:\/\//, '').split('.')[0];
  console.info(`[PHAROS] Supabase conectado → ${projectId}.***.supabase.co`);
}
