import { createClient } from '@supabase/supabase-js';

// ── Leitura das variáveis de ambiente ─────────────────────────────────────────
// Vite expõe apenas variáveis com prefixo VITE_ para o bundle do browser.
// Se chegarem como undefined, o cliente seria criado com strings literais
// "undefined" e toda requisição falharia silenciosamente com erro 4xx/5xx.
// Por isso validamos explicitamente e lançamos um erro claro em dev.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || supabaseUrl === 'undefined') {
  const msg =
    '[PHAROS] VITE_SUPABASE_URL não está definida.\n' +
    'Verifique seu arquivo .env.local (ou .env) e certifique-se de que o prefixo é VITE_,\n' +
    'não NEXT_PUBLIC_ nem sem prefixo.\n' +
    'Exemplo: VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co';
  console.error(msg);
  throw new Error(msg);
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  const msg =
    '[PHAROS] VITE_SUPABASE_ANON_KEY não está definida.\n' +
    'Localize a chave "anon / public" em: Supabase Dashboard → Settings → API.\n' +
    'Adicione ao .env.local como: VITE_SUPABASE_ANON_KEY=<sua_chave_anon>';
  console.error(msg);
  throw new Error(msg);
}

// ── Cliente Supabase (singleton) ──────────────────────────────────────────────
// Esta instância usa a chave ANON — segura para o browser.
// NUNCA use SUPABASE_SERVICE_ROLE_KEY aqui.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persiste a sessão no localStorage para que o usuário não precise
    // fazer login a cada recarga de página.
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ── Base URL das Edge Functions ───────────────────────────────────────────────
// Usado pelos contextos de admin para chamar as funções seguras no servidor.
export const EDGE_BASE = `${supabaseUrl}/functions/v1`;

// ── Helpers de diagnóstico (apenas dev) ──────────────────────────────────────
if (import.meta.env.DEV) {
  console.info(
    `[PHAROS] Supabase conectado → ${supabaseUrl.replace(/https?:\/\//, '').split('.')[0]}.***.supabase.co`
  );
}
