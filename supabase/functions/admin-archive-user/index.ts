/**
 * Edge Function: admin-archive-user
 * PATCH /functions/v1/admin-archive-user
 * Header: Authorization: Bearer <admin_jwt>
 * Body: { userId: string, archive: boolean }
 *
 * archive = true  → is_archived = true,  archived_at = now()
 * archive = false → is_archived = false, archived_at = null  (restaurar)
 *
 * NÃO exclui nenhum dado. Apenas marca o campo is_archived no profile.
 * A conta no Supabase Auth, documentos e todos os registros permanecem intactos.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'PATCH') return json({ error: 'Método não permitido.' }, 405);

  const ADMIN_JWT_SECRET      = Deno.env.get('ADMIN_JWT_SECRET');
  const SUPABASE_URL          = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!ADMIN_JWT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return json({ error: 'Configuração do servidor incompleta.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !(await verifyAdminToken(token, ADMIN_JWT_SECRET))) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  let body: { userId?: string; archive?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { userId, archive } = body;

  if (!userId || typeof userId !== 'string') {
    return json({ error: 'Campo "userId" obrigatório.' }, 400);
  }
  if (typeof archive !== 'boolean') {
    return json({ error: 'Campo "archive" deve ser boolean.' }, 400);
  }

  // Valida UUID
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) return json({ error: 'userId inválido.' }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_archived: archive,
      archived_at: archive ? new Date().toISOString() : null,
    })
    .eq('id', userId)
    .select('id, is_archived, archived_at')
    .single();

  if (error) {
    console.error('[admin-archive-user] Erro ao atualizar perfil:', error.message);
    return json({ error: 'Erro ao atualizar usuário.' }, 500);
  }

  return json({ success: true, profile: data });
});
