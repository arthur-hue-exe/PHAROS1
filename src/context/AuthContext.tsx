import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AccountType = 'particular' | 'empresa';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  email_verified: boolean;
  documents_uploaded: boolean;
  /** Tipo de conta: particular (pessoa física) ou empresa */
  account_type: AccountType;
  /** Razão social / nome fantasia — preenchido apenas para empresas */
  company_name: string | null;
  /** Slug do curso escolhido (apenas particulares) */
  course_slug: string | null;
  /** Nome do curso escolhido (apenas particulares) */
  course_name: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    phone: string,
    name: string,
    accountType: AccountType,
    companyName?: string,
    cnpj?: string,
    courseSlug?: string,
    courseName?: string
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_SELECT =
  'id, name, email, phone, email_verified, documents_uploaded, account_type, company_name, cnpj, course_slug, course_name';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── fetchProfile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('[AuthContext] fetchProfile error:', error.message);
      }
      return;
    }
    if (data) {
      setProfile({
        ...data,
        account_type: (data.account_type as AccountType) ?? 'particular',
        company_name: data.company_name ?? null,
        cnpj: data.cnpj ?? null,
        course_slug: data.course_slug ?? null,
        course_name: data.course_name ?? null,
      } as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ── Inicialização / escuta de auth state ─────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── signUp ───────────────────────────────────────────────────────────────
  // Cria o usuário no Supabase Auth e depois atualiza a tabela profiles
  // com account_type, company_name e cnpj (o trigger cria o registro base).
  const signUp = useCallback(async (
    email: string,
    password: string,
    phone: string,
    name: string,
    accountType: AccountType,
    companyName?: string,
    cnpj?: string,
    courseSlug?: string,
    courseName?: string
  ): Promise<{ error: string | null }> => {
    // 1. Criar conta no Auth — inclui course_slug/course_name nos metadados
    //    para que o trigger handle_new_user possa lê-los e inserir junto ao profile.
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          account_type: accountType,
          company_name: companyName ?? null,
          cnpj: cnpj ?? null,
          course_slug: courseSlug ?? null,
          course_name: courseName ?? null,
        },
      },
    });

    if (authError) return { error: authError.message };

    // 2. O trigger handle_new_user cria o perfil após o INSERT em auth.users.
    //    Aguardamos a linha existir antes de fazer o UPDATE para evitar
    //    a race condition onde UPDATE afeta 0 linhas silenciosamente.
    if (data.user) {
      const userId = data.user.id;
      let profileCreated = false;

      // Aguarda até 2 segundos pelo trigger criar o profile
      for (let attempt = 1; attempt <= 6; attempt++) {
        await new Promise((r) => setTimeout(r, attempt * 300)); // 300, 600, 900...

        // Verificar se o profile já existe
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existing) {
          if (import.meta.env.DEV) {
            console.warn(`[AuthContext] signUp: profile ainda não existe (tentativa ${attempt})`);
          }
          continue; // trigger ainda não rodou — aguarda mais
        }

        profileCreated = true;

        // Profile existe — faz o UPDATE completo
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            account_type: accountType,
            company_name: companyName ?? null,
            cnpj: cnpj ?? null,
            ...(courseSlug ? { course_slug: courseSlug } : {}),
            ...(courseName ? { course_name: courseName } : {}),
          })
          .eq('id', userId);

        if (!updateError) {
          break; // sucesso
        }

        if (import.meta.env.DEV) {
          console.warn(`[AuthContext] signUp: UPDATE falhou (tentativa ${attempt}):`, updateError.message);
        }
      }

      if (!profileCreated && import.meta.env.DEV) {
        console.error('[AuthContext] signUp: profile não foi criado pelo trigger após 6 tentativas.');
      }
    }

    return { error: null };
  }, []);

  // ── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  // ── signOut ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
