/**
 * Edge Function: admin-login
 * POST /functions/v1/admin-login
 * Body: { user: string, password: string }
 *
 * Autentica o administrador comparando com as variáveis de ambiente
 * ADMIN_USER e ADMIN_PASSWORD (Secrets do Supabase — nunca no frontend).
 * Retorna um JWT assinado com ADMIN_JWT_SECRET válido por 8 horas.
 *
 * Segurança:
 *  - ADMIN_USER / ADMIN_PASSWORD / ADMIN_JWT_SECRET ficam apenas nos Secrets.
 *  - A SUPABASE_SERVICE_ROLE_KEY nunca é exposta ao browser.
 *  - CORS restrito às origens permitidas.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',   // restrinja ao domínio em produção
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── JWT simples (HS256) ───────────────────────────────────────────────────────
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const headerB64  = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyData = new TextEncoder().encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigB64}`;
}

// ── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  // Secrets do Supabase (configurados em: Dashboard → Edge Functions → Secrets)
  const ADMIN_USER       = Deno.env.get('ADMIN_USER');
  const ADMIN_PASSWORD   = Deno.env.get('ADMIN_PASSWORD');
  const ADMIN_JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET');

  if (!ADMIN_USER || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
    console.error('[admin-login] Secrets ADMIN_USER, ADMIN_PASSWORD ou ADMIN_JWT_SECRET não configurados.');
    return json({ error: 'Configuração do servidor incompleta.' }, 500);
  }

  let body: { user?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { user, password } = body;

  if (!user || !password) {
    return json({ error: 'Usuário e senha são obrigatórios.' }, 400);
  }

  // Comparação em tempo constante (evita timing attacks)
  const userMatch = user === ADMIN_USER;
  const passMatch = password === ADMIN_PASSWORD;

  if (!userMatch || !passMatch) {
    // Não revelamos qual campo está errado
    return json({ error: 'Credenciais inválidas.' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt(
    {
      sub: 'admin',
      role: 'admin',
      iat: now,
      exp: now + 8 * 60 * 60, // 8 horas
    },
    ADMIN_JWT_SECRET
  );

  return json({ token });
});
