/**
 * Edge Function: admin-user-docs
 * GET /functions/v1/admin-user-docs?userId=<uuid>
 * Header: Authorization: Bearer <admin_jwt>
 *
 * Lista os documentos de um usuário específico e gera signed URLs
 * temporárias (1 hora) para download seguro pelo administrador.
 *
 * O bucket "documents" é PRIVADO — nunca há URL pública permanente.
 * O administrador baixa através de URLs assinadas geradas aqui no servidor.
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
  if (req.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);

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

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return json({ error: 'Parâmetro userId obrigatório.' }, 400);

  // Valida UUID básico
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) return json({ error: 'userId inválido.' }, 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1. Busca metadados dos documentos no banco
  const { data: docs, error: dbErr } = await supabase
    .from('documents')
    .select('id, document_type, storage_path, file_name, file_size, mime_type, uploaded_at')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: true });

  if (dbErr) {
    console.error('[admin-user-docs] Erro BD:', dbErr.message);
    return json({ error: 'Erro ao buscar documentos.' }, 500);
  }

  if (!docs || docs.length === 0) return json([]);

  // 2. Gera signed URL temporária (3600 s = 1 hora) para cada documento
  //    O admin usa este link para baixar o arquivo diretamente para a máquina.
  const docsWithUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data: signedData, error: signErr } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600, {
          download: doc.file_name, // força download com nome original
        });

      if (signErr) {
        console.error(`[admin-user-docs] Erro ao gerar signed URL para ${doc.storage_path}:`, signErr.message);
        return { ...doc, download_url: null, download_error: 'Falha ao gerar URL de download.' };
      }

      return {
        ...doc,
        download_url: signedData.signedUrl,
        download_error: null,
      };
    })
  );

  return json(docsWithUrls);
});
