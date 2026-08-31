/**
 * AdminContext — estado global do painel administrativo.
 *
 * Fluxo de autenticação:
 *  1. Admin chama login(user, password)
 *  2. Frontend POST → Edge Function admin-login (valida credenciais nos Secrets do Supabase)
 *  3. Edge Function retorna JWT HS256 assinado (válido 8h)
 *  4. Token é salvo no sessionStorage (não localStorage — expira ao fechar a aba)
 *  5. Demais Edge Functions recebem o token no header Authorization: Bearer <token>
 *
 * Segurança:
 *  - SUPABASE_SERVICE_ROLE_KEY nunca chega ao browser
 *  - ADMIN_PASSWORD nunca fica no frontend
 *  - Token expira em 8h e não é renovado automaticamente
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { EDGE_BASE } from '@/lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminContextValue {
  adminToken: string | null;
  adminLoading: boolean;
  adminError: string;
  login: (user: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Altera is_available de um curso via Edge Function admin-update-course */
  updateCourseAvailability: (slug: string, isAvailable: boolean) => Promise<boolean>;
}

// ── Storage key ───────────────────────────────────────────────────────────────
const SESSION_KEY = 'pharos_admin_token';

// ── Helpers de diagnóstico de erro ───────────────────────────────────────────
function parseLoginError(status: number, serverError?: string): string {
  if (!navigator.onLine) return 'Sem conexão com a internet.';
  if (status === 401) return 'Usuário ou senha incorretos.';
  if (status === 500) return 'Erro interno do servidor. Verifique os Secrets da Edge Function.';
  if (status === 0 || status >= 502)
    return 'Servidor indisponível. Verifique se as Edge Functions estão publicadas.';
  return serverError ?? 'Erro desconhecido ao autenticar.';
}

// ── Context ───────────────────────────────────────────────────────────────────
const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Recupera token persistido no sessionStorage (sobrevive a F5, não ao fechar aba)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Sincroniza sessionStorage sempre que o token mudar
  useEffect(() => {
    try {
      if (adminToken) {
        sessionStorage.setItem(SESSION_KEY, adminToken);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage pode estar bloqueado em private browsing de alguns browsers
    }
  }, [adminToken]);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (user: string, password: string): Promise<boolean> => {
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });

      let data: { token?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // resposta não é JSON (ex: função não publicada retorna HTML 404)
      }

      if (!res.ok || !data.token) {
        const msg = parseLoginError(res.status, data.error);
        setAdminError(msg);
        if (import.meta.env.DEV) {
          console.error(`[AdminContext] login falhou — HTTP ${res.status}:`, data.error ?? '(sem mensagem)');
        }
        return false;
      }

      setAdminToken(data.token);
      return true;
    } catch (err) {
      // Erro de rede (fetch falhou antes de receber resposta)
      const isOffline = !navigator.onLine;
      const msg = isOffline
        ? 'Sem conexão com a internet.'
        : 'Não foi possível alcançar o servidor. Verifique se as Edge Functions estão publicadas no Supabase.';
      setAdminError(msg);
      if (import.meta.env.DEV) {
        console.error('[AdminContext] Erro de rede no login:', err);
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
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ slug, is_available: isAvailable }),
        });

        if (res.status === 401) {
          // Token expirou
          setAdminToken(null);
          setAdminError('Sessão expirada. Faça login novamente.');
          return false;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error('[AdminContext] updateCourseAvailability falhou:', data.error);
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

  return (
    <AdminContext.Provider
      value={{
        adminToken,
        adminLoading,
        adminError,
        login,
        logout,
        updateCourseAvailability,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
