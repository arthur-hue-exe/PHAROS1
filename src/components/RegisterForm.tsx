/**
 * RegisterForm — cadastro e login do PHAROS.
 *
 * Fluxo particular: cadastro → verify-email → upload-docs → docs-sent
 * Fluxo empresa:    cadastro → company-enrollees (gerenciar candidatos)
 *                   login   → company-enrollees
 */
import { useState } from 'react';
import {
  Eye, EyeOff, Loader2, UserPlus, ArrowLeft, LogIn,
  User, Building2,
} from 'lucide-react';
import { useAuth, type AccountType } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Este e-mail já está cadastrado. Tente entrar na conta.';
  if (msg.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('Password should be'))
    return 'A senha deve ter ao menos 6 caracteres.';
  return msg;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const { signUp, signIn, profile } = useAuth();
  const { navigate } = useRouter();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [accountType, setAccountType] = useState<AccountType>('particular');

  // Campos comuns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Campos particular
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Campos empresa
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [responsibleName, setResponsibleName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers de navegação pós-autenticação ─────────────────────────────────
  function navigateAfterAuth(type: AccountType, emailVerified?: boolean, docsUploaded?: boolean) {
    if (type === 'empresa') {
      navigate({ name: 'company-enrollees' });
      return;
    }
    // particular: retoma no ponto do funil
    if (!emailVerified) {
      navigate({ name: 'verify-email' });
    } else if (!docsUploaded) {
      navigate({ name: 'upload-docs' });
    } else {
      navigate({ name: 'docs-sent' });
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (accountType === 'particular') {
        if (!name.trim()) return setError('Informe seu nome completo.');
        if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.');
      } else {
        if (!companyName.trim()) return setError('Informe o nome da empresa.');
        if (!responsibleName.trim()) return setError('Informe o nome do responsável.');
        if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.');
      }
    }

    setLoading(true);

    if (mode === 'register') {
      const isEmpresa = accountType === 'empresa';
      const { error: err } = await signUp(
        email,
        password,
        isEmpresa
          ? companyPhone.replace(/\D/g, '')
          : phone.replace(/\D/g, ''),
        isEmpresa ? responsibleName : name,
        accountType,
        isEmpresa ? companyName : undefined,
        isEmpresa ? cnpj.replace(/\D/g, '') : undefined
      );
      if (err) {
        setError(translateError(err));
      } else {
        // Após signup, empresa vai direto para gerenciar candidatos
        // Particular precisa verificar e-mail
        navigateAfterAuth(accountType, false, false);
      }
    } else {
      // Login — verifica o accountType atual do profile para decidir rota
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(translateError(err));
      } else {
        // profile pode ainda não ter carregado — usamos o do hook
        // mas como o onAuthStateChange atualiza em async, aguardamos um tick
        await new Promise((r) => setTimeout(r, 300));
        // Lemos o perfil atual (pode ser null se ainda não carregou)
        // Nesse caso, o profile guardado no context já terá o account_type
        // A rota será decidida no próximo render pelo estado do auth
        // Forçamos navegação baseada no profile que acabou de carregar
        if (profile?.account_type === 'empresa') {
          navigate({ name: 'company-enrollees' });
        } else {
          // Navegação particular — retoma funil no ponto correto
          navigateAfterAuth(
            'particular',
            profile?.email_verified,
            profile?.documents_uploaded
          );
        }
      }
    }
    setLoading(false);
  };

  const switchMode = (m: 'register' | 'login') => {
    setMode(m);
    setError('');
  };

  const switchAccountType = (t: AccountType) => {
    setAccountType(t);
    setError('');
  };

  // ── Render ────────────────────────────────────────────────────────────────
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

          {/* ── Toggle Cadastrar / Já tenho conta ── */}
          <div className="flex rounded-lg border border-white/10 bg-graphite/60 p-1 mb-6">
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-pharos-red text-white' : 'text-steel hover:text-white'
              }`}
            >
              Cadastrar
            </button>
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-pharos-red text-white' : 'text-steel hover:text-white'
              }`}
            >
              Já tenho conta
            </button>
          </div>

          {/* ── Seleção Particular / Empresa (apenas no cadastro) ── */}
          {mode === 'register' && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">
                Tipo de cadastro
              </p>
              <div className="grid grid-cols-2 gap-3">
                <AccountTypeCard
                  type="particular"
                  selected={accountType === 'particular'}
                  icon={<User className="h-5 w-5" />}
                  label="Sou Particular"
                  description="Matrícula individual"
                  onClick={() => switchAccountType('particular')}
                />
                <AccountTypeCard
                  type="empresa"
                  selected={accountType === 'empresa'}
                  icon={<Building2 className="h-5 w-5" />}
                  label="Sou Empresa"
                  description="Múltiplos candidatos"
                  onClick={() => switchAccountType('empresa')}
                />
              </div>
            </div>
          )}

          {/* ── Título ── */}
          <h1 className="font-display text-2xl font-bold text-white">
            {mode === 'register'
              ? accountType === 'empresa'
                ? 'Cadastro empresarial'
                : 'Criar cadastro'
              : 'Entrar na conta'}
          </h1>
          <p className="mt-1.5 text-sm text-steel">
            {mode === 'register'
              ? accountType === 'empresa'
                ? 'Cadastre sua empresa e gerencie as pré-matrículas dos candidatos.'
                : 'Preencha os dados abaixo para iniciar sua matrícula.'
              : 'Acesse sua conta para continuar.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* ── Campos PARTICULAR (cadastro) ── */}
            {mode === 'register' && accountType === 'particular' && (
              <>
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
              </>
            )}

            {/* ── Campos EMPRESA (cadastro) ── */}
            {mode === 'register' && accountType === 'empresa' && (
              <>
                <div>
                  <label className="input-label">Nome da empresa / razão social</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field"
                    placeholder="Razão social ou nome fantasia"
                    required
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label className="input-label">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    className="input-field"
                    placeholder="00.000.000/0001-00"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="input-label">Nome do responsável</label>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="input-field"
                    placeholder="Nome de quem realizará o cadastro"
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="input-label">Telefone / WhatsApp da empresa</label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(formatPhone(e.target.value))}
                    className="input-field"
                    placeholder="(62) 99999-9999"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            {/* ── E-mail (sempre visível) ── */}
            <div>
              <label className="input-label">
                {accountType === 'empresa' && mode === 'register'
                  ? 'E-mail empresarial'
                  : 'E-mail'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={
                  accountType === 'empresa' && mode === 'register'
                    ? 'contato@suaempresa.com.br'
                    : 'seu@email.com'
                }
                required
                autoComplete="email"
              />
              {accountType === 'empresa' && mode === 'register' && (
                <p className="mt-1 text-xs text-steel/70">
                  Este e-mail será a conta única da empresa. Não é possível cadastrar o mesmo e-mail mais de uma vez.
                </p>
              )}
            </div>

            {/* ── Senha ── */}
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

            {/* ── Erro ── */}
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            {/* ── Submit ── */}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin-slow" />
                  {mode === 'register' ? 'Cadastrando...' : 'Entrando...'}
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  {accountType === 'empresa' ? 'Criar conta empresarial' : 'Criar cadastro'}
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

// ── Sub-componente: card de seleção de tipo de conta ─────────────────────────

function AccountTypeCard({
  selected,
  icon,
  label,
  description,
  onClick,
}: {
  type: AccountType;
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
        selected
          ? 'border-pharos-red bg-pharos-red/10 text-white'
          : 'border-white/15 bg-graphite/40 text-steel hover:border-white/30 hover:text-white'
      }`}
    >
      <span className={selected ? 'text-pharos-red' : 'text-steel'}>{icon}</span>
      <span className="font-display text-sm font-semibold leading-tight">{label}</span>
      <span className="text-[11px] leading-tight opacity-70">{description}</span>
    </button>
  );
}
