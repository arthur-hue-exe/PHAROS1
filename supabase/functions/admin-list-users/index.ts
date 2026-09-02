/**
 * Edge Function: admin-list-users
 * GET /functions/v1/admin-list-users
 * Header: Authorization: Bearer <admin_jwt>
 *
 * Lista todos os perfis de usuários para o painel administrativo.
 * Para contas do tipo "empresa", busca também os candidatos vinculados
 * (tabela company_enrollees).
 *
 * Usa SUPABASE_SERVICE_ROLE_KEY para ignorar RLS — seguro pois roda no servidor.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
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

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !(await verifyAdminToken(token, ADMIN_JWT_SECRET))) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // Parâmetro ?archived=true → lista arquivados; padrão → lista ativos
  const url = new URL(req.url);
  const showArchived = url.searchParams.get('archived') === 'true';

  // ── 1. Busca perfis filtrados por is_archived ──────────────────────────────
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select(
      'id, name, email, phone, email_verified, documents_uploaded, ' +
      'documents_uploaded_at, created_at, account_type, company_name, cnpj, ' +
      'course_slug, course_name, is_archived, archived_at'
    )
    .eq('is_archived', showArchived)
    .order('created_at', { ascending: false });

  if (profilesErr) {
    console.error('[admin-list-users] Erro ao buscar perfis:', profilesErr.message);
    return json({ error: 'Erro ao buscar usuários.' }, 500);
  }

  if (!profiles || profiles.length === 0) return json([]);

  // ── 2. Para contas empresa, busca os candidatos vinculados ────────────────
  const companyIds = profiles
    .filter((p) => p.account_type === 'empresa')
    .map((p) => p.id);

  let enrolleesMap: Record<string, unknown[]> = {};

  if (companyIds.length > 0) {
    const { data: enrollees, error: enrolleesErr } = await supabase
      .from('company_enrollees')
      .select('id, company_id, name, cpf, phone, course, course_slug, notes, status, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: true });

    if (enrolleesErr) {
      // Não é fatal — retorna perfis sem os candidatos
      console.error('[admin-list-users] Erro ao buscar enrollees:', enrolleesErr.message);
    } else if (enrollees) {
      // Agrupa candidatos por company_id para lookup O(1)
      for (const e of enrollees) {
        const cid = e.company_id as string;
        if (!enrolleesMap[cid]) enrolleesMap[cid] = [];
        enrolleesMap[cid].push(e);
      }
    }
  }

  // ── 3. Mescla candidatos ao perfil da empresa ─────────────────────────────
  const result = profiles.map((p) => ({
    ...p,
    account_type: (p.account_type as string) ?? 'particular',
    company_name: p.company_name ?? null,
    cnpj: p.cnpj ?? null,
    course_slug: p.course_slug ?? null,
    course_name: p.course_name ?? null,
    is_archived: p.is_archived ?? false,
    archived_at: p.archived_at ?? null,
    enrollees: p.account_type === 'empresa' ? (enrolleesMap[p.id] ?? []) : [],
  }));

  return json(result);
});
