/**
 * AdminContext — estado global do painel administrativo.
 *
 * Fluxo de autenticação:
 *  1. Admin chama login(user, password)
 *  2. Frontend POST → Edge Function admin-login
 *     Header Authorization: Bearer <VITE_SUPABASE_ANON_KEY>
 *     Header apikey: <VITE_SUPABASE_ANON_KEY>
 *     (O gateway do Supabase exige esses headers para liberar Edge Functions)
 *  3. Edge Function valida ADMIN_USER/ADMIN_PASSWORD nos Secrets do Supabase
 *  4. Retorna JWT HS256 assinado com ADMIN_JWT_SECRET (válido 8h)
 *  5. Token salvo em sessionStorage — expira ao fechar a aba
 *  6. Demais Edge Functions recebem: Authorization: Bearer <admin_jwt>
 *
 * Segurança:
 *  - SUPABASE_SERVICE_ROLE_KEY nunca chega ao browser
 *  - ADMIN_PASSWORD nunca fica no frontend
 *  - VITE_SUPABASE_ANON_KEY é chave pública — segura no bundle
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { EDGE_BASE, SUPABASE_CONFIGURED } from '@/lib/supabase';

// Anon key: chave pública do Supabase — necessária como header para o gateway
// liberar chamadas a Edge Functions. NÃO é a service_role key.
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminContextValue {
  adminToken: string | null;
  adminLoading: boolean;
  adminError: string;
  login: (user: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCourseAvailability: (slug: string, isAvailable: boolean) => Promise<boolean>;
  /** Arquiva (archive=true) ou restaura (archive=false) um usuário no painel */
  archiveUser: (userId: string, archive: boolean) => Promise<boolean>;
}

const SESSION_KEY = 'pharos_admin_token';

// ── Diagnóstico de erro por status HTTP ──────────────────────────────────────
function parseLoginError(status: number, body?: { error?: string; message?: string; code?: string }): string {
  // Problemas de configuração local/Vercel
  if (!SUPABASE_CONFIGURED) {
    return 'Configuração incompleta: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas nas variáveis de ambiente.';
  }
  if (!EDGE_BASE) {
    return 'URL do Supabase não configurada. Verifique VITE_SUPABASE_URL nas variáveis de ambiente.';
  }

  if (!navigator.onLine) return 'Sem conexão com a internet.';

  switch (status) {
    case 0:
      // fetch lançou TypeError antes de receber resposta — geralmente CORS ou DNS
      return 'Erro de rede: não foi possível conectar ao Supabase. Verifique se a URL está correta e se há conectividade.';
    case 401:
      // Gateway bloqueou (anon key inválida) ou credenciais incorretas
      if (body?.code === 'UNAUTHORIZED_NO_AUTH_HEADER')
        return 'Erro de configuração: header de autenticação ausente. A anon key pode estar incorreta.';
      return 'Usuário ou senha incorretos.';
    case 403:
      return 'Acesso negado. Verifique as permissões da Edge Function no Supabase.';
    case 404:
      return 'Edge Function não encontrada. Confirme que "admin-login" foi publicada no Supabase Dashboard → Edge Functions.';
    case 405:
      return 'Método não permitido pela Edge Function.';
    case 500:
      return 'Erro interno na Edge Function. Verifique se os Secrets ADMIN_USER, ADMIN_PASSWORD e ADMIN_JWT_SECRET estão configurados no Supabase.';
    case 502:
    case 503:
    case 504:
      return 'Edge Function indisponível ou com timeout. Tente novamente em instantes.';
    default:
      if (status >= 400 && status < 500)
        return body?.error ?? body?.message ?? `Erro ${status} ao autenticar.`;
      if (status >= 500)
        return body?.error ?? `Erro interno (${status}). Verifique os logs da Edge Function.`;
      return body?.error ?? 'Erro desconhecido ao autenticar.';
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    try {
      if (adminToken) sessionStorage.setItem(SESSION_KEY, adminToken);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch { /* private browsing */ }
  }, [adminToken]);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (user: string, password: string): Promise<boolean> => {
    setAdminLoading(true);
    setAdminError('');

    // Verifica configuração antes de tentar
    if (!SUPABASE_CONFIGURED) {
      setAdminError(parseLoginError(0, undefined));
      setAdminLoading(false);
      return false;
    }
    if (!EDGE_BASE) {
      setAdminError('URL do Supabase não configurada. Verifique VITE_SUPABASE_URL.');
      setAdminLoading(false);
      return false;
    }

    let status = 0;
    let body: { token?: string; error?: string; message?: string; code?: string } = {};

    try {
      const res = await fetch(`${EDGE_BASE}/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Necessário para o gateway do Supabase liberar a chamada à Edge Function
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user, password }),
      });

      status = res.status;

      // Tenta parsear o JSON — pode falhar se a função retornar HTML (ex: 404 do gateway)
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        body = await res.json().catch(() => ({}));
      } else {
        // Resposta não-JSON: provavelmente erro do gateway (HTML de 404/502)
        const text = await res.text().catch(() => '');
        if (import.meta.env.DEV) {
          console.error(`[AdminContext] Resposta não-JSON (${status}):`, text.slice(0, 300));
        }
        body = {};
      }

      if (!res.ok || !body.token) {
        const msg = parseLoginError(status, body);
        setAdminError(msg);
        if (import.meta.env.DEV) {
          console.error(`[AdminContext] login falhou — HTTP ${status}`, body);
        }
        return false;
      }

      setAdminToken(body.token);
      return true;

    } catch (err) {
      // fetch lançou antes de receber resposta (CORS, DNS, offline)
      const isOffline = !navigator.onLine;
      if (isOffline) {
        setAdminError('Sem conexão com a internet.');
      } else if (err instanceof TypeError && String(err).includes('CORS')) {
        setAdminError('Erro de CORS: o Supabase bloqueou a requisição. Verifique a configuração da Edge Function.');
      } else {
        setAdminError(
          `Não foi possível conectar ao Supabase (${EDGE_BASE}/admin-login). ` +
          'Verifique se a URL do projeto está correta e se a Edge Function está publicada.'
        );
      }
      if (import.meta.env.DEV) {
        console.error('[AdminContext] Erro de rede/fetch no login:', err);
        console.error('[AdminContext] URL tentada:', `${EDGE_BASE}/admin-login`);
        console.error('[AdminContext] SUPABASE_CONFIGURED:', SUPABASE_CONFIGURED);
        console.error('[AdminContext] EDGE_BASE:', EDGE_BASE);
      }
      return false;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setAdminToken(null);
    setAdminError('');
  }, []);

  // ── updateCourseAvailability ───────────────────────────────────────────────
  const updateCourseAvailability = useCallback(
    async (slug: string, isAvailable: boolean): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch(`${EDGE_BASE}/admin-update-course`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ slug, is_available: isAvailable }),
        });

        if (res.status === 401) {
          setAdminToken(null);
          setAdminError('Sessão expirada. Faça login novamente.');
          return false;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[AdminContext] updateCourseAvailability falhou:', res.status, data);
          return false;
        }
        return true;
      } catch (err) {
        console.error('[AdminContext] Erro de rede ao atualizar curso:', err);
        return false;
      }
    },
    [adminToken]
  );

  // ── archiveUser ───────────────────────────────────────────────────────────
  const archiveUser = useCallback(
    async (userId: string, archive: boolean): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch(`${EDGE_BASE}/admin-archive-user`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ userId, archive }),
        });
        if (res.status === 401) {
          setAdminToken(null);
          setAdminError('Sessão expirada. Faça login novamente.');
          return false;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[AdminContext] archiveUser falhou:', res.status, data);
          return false;
        }
        return true;
      } catch (err) {
        console.error('[AdminContext] Erro de rede ao arquivar usuário:', err);
        return false;
      }
    },
    [adminToken]
  );

  return (
    <AdminContext.Provider value={{ adminToken, adminLoading, adminError, login, logout, updateCourseAvailability, archiveUser }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
