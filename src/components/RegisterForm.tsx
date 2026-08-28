import { useState } from 'react';
import { Eye, EyeOff, Loader2, UserPlus, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

export default function RegisterForm() {
  const { signUp, signIn } = useAuth();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim()) return setError('Informe seu nome completo.');
      if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.');
    }

    setLoading(true);

    if (mode === 'register') {
      const { error: err } = await signUp(email, password, phone.replace(/\D/g, ''), name);
      if (err) {
        setError(translateError(err));
      } else {
        navigate({ name: 'verify-email' });
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(translateError(err));
      } else {
        navigate({ name: 'upload-docs' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-6 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-8">
          <div className="flex rounded-lg border border-white/10 bg-graphite/60 p-1 mb-6">
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-pharos-red text-white' : 'text-steel hover:text-white'
              }`}
            >
              Cadastrar
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-pharos-red text-white' : 'text-steel hover:text-white'
              }`}
            >
              Já tenho conta
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold text-white">
            {mode === 'register' ? 'Criar cadastro' : 'Entrar na conta'}
          </h1>
          <p className="mt-1.5 text-sm text-steel">
            {mode === 'register'
              ? 'Preencha os dados abaixo para iniciar sua matrícula.'
              : 'Acesse sua conta para continuar o processo de matrícula.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="input-label">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Seu nome completo"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="input-label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="input-label">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="input-field"
                  placeholder="(62) 99999-9999"
                  required
                />
              </div>
            )}

            <div>
              <label className="input-label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin-slow" />
                  {mode === 'register' ? 'Cadastrando...' : 'Entrando...'}
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Criar cadastro
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar na conta.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (msg.includes('Password should be')) {
    return 'A senha deve ter ao menos 6 caracteres.';
  }
  return msg;
}
