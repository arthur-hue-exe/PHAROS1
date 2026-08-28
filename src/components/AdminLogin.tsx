import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from '@/context/RouterContext';

export default function AdminLogin() {
  const { login, adminLoading, adminError } = useAdmin();
  const { navigate } = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(user, password);
  };

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10 mx-auto">
            <ShieldCheck className="h-7 w-7 text-pharos-red" />
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold text-white text-center">
            Acesso Restrito
          </h1>
          <p className="mt-1.5 text-sm text-steel text-center">
            Painel de Administração — PHAROS
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="input-label">Usuário</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="input-field"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="input-label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel transition-colors hover:text-white"
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {adminError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {adminError}
              </p>
            )}

            <button type="submit" disabled={adminLoading} className="btn-primary w-full mt-2">
              {adminLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin-slow" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Entrar no painel
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate({ name: 'home' })}
            className="mt-4 w-full text-center text-sm text-steel transition-colors hover:text-white"
          >
            Voltar ao site
          </button>
        </div>
      </div>
    </div>
  );
}
