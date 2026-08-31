/**
 * VerifyEmail — confirmação de e-mail via OTP nativo do Supabase.
 *
 * Fluxo:
 *  1. No signup, o Supabase envia automaticamente um e-mail com OTP de 6 dígitos.
 *  2. O usuário digita o código aqui.
 *  3. Chamamos supabase.auth.verifyOtp({ email, token, type: 'signup' }).
 *  4. O Supabase confirma o e-mail e marca email_confirmed_at na tabela auth.users.
 *  5. Um trigger no banco sincroniza email_confirmed_at → profiles.email_verified = true.
 *  6. O usuário é redirecionado para upload-docs (particular) ou company-enrollees (empresa).
 *
 * Não utiliza RPCs customizadas (generate_verification_code / verify_email),
 * que foram removidas por não existirem no banco e gerarem erros de 404.
 * Não há MFA neste fluxo — é apenas a confirmação de e-mail padrão do Supabase.
 */

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redireciona se o e-mail já está verificado
  useEffect(() => {
    if (!profile) return;
    if (profile.email_verified) {
      if (profile.account_type === 'empresa') {
        navigate({ name: 'company-enrollees' });
      } else {
        navigate({ name: 'upload-docs' });
      }
    }
  }, [profile, navigate]);

  // Contador de cooldown para reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Reenviar e-mail de confirmação ────────────────────────────────────────
  const handleResend = async () => {
    if (!user?.email || resendCooldown > 0) return;
    setResending(true);
    setError('');
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    setResending(false);
    if (resendErr) {
      setError('Não foi possível reenviar o código. Tente novamente em instantes.');
    } else {
      setResendCooldown(60); // aguarda 60s antes de permitir novo reenvio
    }
  };

  // ── Digitar código ────────────────────────────────────────────────────────
  const handleDigit = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit quando todos os dígitos estão preenchidos
    if (char && index === OTP_LENGTH - 1) {
      const code = next.join('');
      if (code.length === OTP_LENGTH) submitCode(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text.length === OTP_LENGTH) {
      setDigits(text.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      submitCode(text);
    }
  };

  // ── Verificar OTP via Supabase Auth nativo ────────────────────────────────
  const submitCode = async (code: string) => {
    if (!user?.email) return;
    if (code.length < OTP_LENGTH) {
      setError('Digite os 6 dígitos do código.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: otpErr } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'signup',
    });

    if (otpErr) {
      setLoading(false);
      // Mensagem amigável sem expor detalhes técnicos
      if (otpErr.message.includes('expired') || otpErr.message.includes('invalid')) {
        setError('Código inválido ou expirado. Clique em "Reenviar código" para receber um novo.');
      } else {
        setError('Não foi possível verificar o código. Tente novamente.');
      }
      if (import.meta.env.DEV) {
        console.error('[VerifyEmail] verifyOtp error:', otpErr.message);
      }
      return;
    }

    // Sucesso: atualizar profile para refletir email_verified = true
    // O trigger no banco já faz isso via email_confirmed_at,
    // mas fazemos refreshProfile para atualizar o estado local imediatamente.
    await refreshProfile();
    // O useEffect acima vai redirecionar quando profile.email_verified ficar true.
    // Caso o trigger ainda não tenha rodado, forçamos a navegação aqui.
    const accountType = profile?.account_type ?? 'particular';
    if (accountType === 'empresa') {
      navigate({ name: 'company-enrollees' });
    } else {
      navigate({ name: 'upload-docs' });
    }
  };

  const handleVerify = () => {
    submitCode(digits.join(''));
  };

  const allFilled = digits.every((d) => d !== '');

  // ── Guardar de rota ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-slow text-pharos-red" />
      </div>
    );
  }

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
            <span className="font-medium text-white">{user.email}</span>.
            Digite o código abaixo para confirmar seu cadastro.
          </p>

          {/* Inputs OTP */}
          <div
            className="mt-7 flex justify-center gap-2"
            onPaste={handlePaste}
          >
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
                autoFocus={i === 0}
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
            disabled={loading || !allFilled}
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
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="mt-4 flex items-center justify-center gap-1.5 w-full text-sm text-steel transition-colors hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : 'Reenviar código'}
          </button>

          <p className="mt-4 text-xs text-steel/60">
            Verifique também a pasta de spam ou lixo eletrônico.
          </p>
        </div>
      </div>
    </div>
  );
}
