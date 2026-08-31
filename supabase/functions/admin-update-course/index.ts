/**
 * Edge Function: admin-update-course
 * PATCH /functions/v1/admin-update-course
 * Header: Authorization: Bearer <admin_jwt>
 * Body: { slug: string, is_available: boolean }
 *
 * Altera a disponibilidade de um curso no banco de dados.
 * Somente o administrador autenticado pode executar esta operação.
 *
 * Segurança:
 *  - Valida o JWT admin antes de qualquer escrita.
 *  - Usa service_role_key apenas no servidor — nunca exposta ao browser.
 *  - RLS na tabela courses bloqueia writes de usuários comuns.
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

  let body: { slug?: string; is_available?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { slug, is_available } = body;

  if (!slug || typeof slug !== 'string') {
    return json({ error: 'Campo "slug" obrigatório.' }, 400);
  }
  if (typeof is_available !== 'boolean') {
    return json({ error: 'Campo "is_available" deve ser boolean.' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('courses')
    .update({ is_available, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('id, slug, name, is_available, updated_at')
    .single();

  if (error) {
    console.error('[admin-update-course] Erro ao atualizar curso:', error.message);
    return json({ error: 'Erro ao atualizar curso.' }, 500);
  }

  if (!data) {
    return json({ error: `Curso com slug "${slug}" não encontrado.` }, 404);
  }

  return json({ success: true, course: data });
});
