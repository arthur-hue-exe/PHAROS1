import { useState, useRef, useEffect } from 'react';
import { MailCheck, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

const OTP_LENGTH = 6;

export default function VerifyEmail() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (profile?.email_verified) navigate({ name: 'upload-docs' });
  }, [profile, navigate]);

  useEffect(() => {
    if (user && !sent) sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendCode = async () => {
    if (!user) return;
    setResending(true);
    setError('');
    const { data, error: fnErr } = await supabase.rpc('generate_verification_code');
    setResending(false);
    if (fnErr) {
      setError('Não foi possível enviar o código. Tente novamente.');
      return;
    }
    setSent(true);
    if (import.meta.env.DEV) {
      console.info(`[DEV] Código de verificação: ${data}`);
    }
  };

  const handleDigit = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      setDigits(text.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) return setError('Digite os 6 dígitos do código.');
    setLoading(true);
    setError('');
    const { data: ok, error: fnErr } = await supabase.rpc('verify_email', { code_input: code });
    setLoading(false);
    if (fnErr || !ok) {
      setError('Código inválido ou expirado. Solicite um novo código.');
      return;
    }
    await refreshProfile();
    navigate({ name: 'upload-docs' });
  };

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate({ name: 'register' })}
          className="mb-6 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10">
            <MailCheck className="h-8 w-8 text-pharos-red" />
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold text-white">
            Verifique seu e-mail
          </h1>
          <p className="mt-2 text-sm text-steel">
            Enviamos um código de 6 dígitos para{' '}
            <span className="font-medium text-white">{user?.email}</span>.
            {import.meta.env.DEV && (
              <span className="block mt-1 text-xs text-amber-400">
                Modo DEV: veja o código no console do navegador (F12).
              </span>
            )}
          </p>

          <div className="mt-7 flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-lg border border-white/15 bg-graphite/80 text-center text-xl font-bold text-white transition-all focus:border-pharos-red focus:outline-none focus:ring-1 focus:ring-pharos-red"
                aria-label={`Dígito ${i + 1} do código`}
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || digits.join('').length < OTP_LENGTH}
            className="btn-primary mt-6 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Verificando...
              </>
            ) : (
              'Confirmar código'
            )}
          </button>

          <button
            onClick={sendCode}
            disabled={resending}
            className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm text-steel transition-colors hover:text-white disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Reenviar código
          </button>
        </div>
      </div>
    </div>
  );
}
