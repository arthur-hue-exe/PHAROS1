import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { EDGE_BASE } from '@/lib/supabase';

interface AdminContextValue {
  adminToken: string | null;
  adminLoading: boolean;
  adminError: string;
  login: (user: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const login = useCallback(async (user: string, password: string): Promise<boolean> => {
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setAdminError(data.error ?? 'Credenciais inválidas');
        return false;
      }
      setAdminToken(data.token);
      return true;
    } catch {
      setAdminError('Erro de conexão com o servidor.');
      return false;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAdminToken(null);
    setAdminError('');
  }, []);

  return (
    <AdminContext.Provider value={{ adminToken, adminLoading, adminError, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
