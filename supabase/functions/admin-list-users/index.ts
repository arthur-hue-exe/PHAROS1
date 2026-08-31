/**
 * Edge Function: admin-list-users
 * GET /functions/v1/admin-list-users
 * Header: Authorization: Bearer <admin_jwt>
 *
 * Lista todos os perfis de usuários para o painel administrativo.
 * Usa SUPABASE_SERVICE_ROLE_KEY para ignorar RLS — seguro pois roda no servidor.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── Verificação do token admin ────────────────────────────────────────────────
async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const keyData = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC', cryptoKey, sigBytes, new TextEncoder().encode(signingInput)
    );
    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role !== 'admin') return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);

  const ADMIN_JWT_SECRET      = Deno.env.get('ADMIN_JWT_SECRET');
  const SUPABASE_URL          = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!ADMIN_JWT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('[admin-list-users] Secrets obrigatórios não configurados.');
    return json({ error: 'Configuração do servidor incompleta.' }, 500);
  }

  // Valida o JWT admin
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !(await verifyAdminToken(token, ADMIN_JWT_SECRET))) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  // Cria cliente com service role para bypassar RLS
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, email_verified, documents_uploaded, documents_uploaded_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin-list-users] Erro ao buscar perfis:', error.message);
    return json({ error: 'Erro ao buscar usuários.' }, 500);
  }

  return json(data ?? []);
});
