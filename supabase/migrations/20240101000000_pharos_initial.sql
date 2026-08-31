-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration inicial
-- Execute no SQL Editor do Supabase Dashboard (ou via supabase db push).
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Extensões necessárias
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABELA: profiles
--    Armazena dados complementares de cada usuário autenticado.
--    Criada automaticamente via trigger quando um usuário se registra.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid        primary key references auth.users(id) on delete cascade,
  name                 text,
  email                text,
  phone                text,
  email_verified       boolean     not null default false,
  documents_uploaded   boolean     not null default false,
  documents_uploaded_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público do usuário — espelho seguro de auth.users com campos extras.';

-- Trigger: cria o profile automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABELA: documents
--    Metadados dos arquivos enviados pelos usuários.
--    O arquivo em si fica no Storage bucket "documents" (privado).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  document_type text        not null,   -- 'cnh' | 'rg' | 'titulo_eleitor' | 'comprovante_residencia'
  storage_path  text        not null,   -- caminho no bucket: {user_id}/{type}_{ts}.{ext}
  file_name     text        not null,   -- nome original do arquivo
  file_size     bigint,                 -- bytes
  mime_type     text,
  uploaded_at   timestamptz not null default now(),

  constraint documents_type_check check (
    document_type in ('cnh','rg','titulo_eleitor','comprovante_residencia')
  )
);

comment on table public.documents is
  'Metadados dos documentos enviados pelos usuários. Arquivos no bucket "documents".';

drop trigger if exists documents_updated_at on public.documents;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABELA: courses
--    Controle de disponibilidade e metadados dos cursos.
--    O campo is_available é alterado pelo admin sem necessidade de deploy.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id           uuid        primary key default uuid_generate_v4(),
  slug         text        not null unique,
  name         text        not null,
  description  text,
  category     text,       -- 'Atualização' | 'Aperfeiçoamento' | 'Profissional'
  image_url    text,       -- URL da imagem (bucket "course-images" ou URL externa)
  is_available boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.courses is
  'Catálogo de cursos. is_available controla se matrículas estão abertas.';
comment on column public.courses.is_available is
  'true = DISPONÍVEL (matrículas abertas) | false = INDISPONÍVEL (matrículas encerradas)';

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at
  before update on public.courses
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED: cursos iniciais (idempotente via ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.courses (slug, name, category, description, image_url, is_available) values
  ('atualizacao-transporte-de-valores',        'Atualização em Transporte de Valores',        'Atualização',      'Reciclagem obrigatória para profissionais de transporte de valores.',                   'https://images.pexels.com/photos/28288101/pexels-photo-28288101.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
  ('aperfeicoamento-seguranca-pessoal-privada','Aperfeiçoamento em Segurança Pessoal Privada','Aperfeiçoamento',  'Capacitação avançada para execução de escolta armada e proteção de pessoas.',            'https://images.pexels.com/photos/8425354/pexels-photo-8425354.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',  true),
  ('atualizacao-seguranca-pessoal-privada',    'Atualização em Segurança Pessoal Privada',    'Atualização',      'Reciclagem para profissionais de segurança pessoal privada.',                           'https://images.pexels.com/photos/8425052/pexels-photo-8425052.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',  true),
  ('supervisor-operacional-e-lideranca',       'Supervisor Operacional e Liderança',          'Profissional',     'Formação para supervisores de operações de segurança.',                                 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
  ('manutencao-e-manuseio-de-armas',           'Manutenção e Manuseio de Armas',              'Profissional',     'Curso prático sobre manuseio, desmontagem, limpeza e manutenção de armas de fogo.',     'https://images.pexels.com/photos/5202438/pexels-photo-5202438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',  true),
  ('monitoramento-cftv',                       'Monitoramento CFTV',                          'Profissional',     'Capacitação para operadores de monitoramento de câmeras de segurança.',                 'https://images.pexels.com/photos/30692441/pexels-photo-30692441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true),
  ('seguranca-bancaria',                       'Segurança Bancária',                          'Profissional',     'Capacitação específica para atuação em segurança bancária.',                           'https://images.pexels.com/photos/13674041/pexels-photo-13674041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', true)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: mark_documents_uploaded
--    Chamada pelo frontend após upload bem-sucedido de todos os documentos.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.mark_documents_uploaded()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    documents_uploaded = true,
    documents_uploaded_at = now()
  where id = auth.uid();
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS — Ativar Row Level Security em todas as tabelas sensíveis
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;
alter table public.courses   enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. POLICIES — profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Usuário lê APENAS seu próprio perfil
drop policy if exists "profiles: usuario le proprio perfil" on public.profiles;
create policy "profiles: usuario le proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Usuário atualiza APENAS seu próprio perfil
drop policy if exists "profiles: usuario atualiza proprio perfil" on public.profiles;
create policy "profiles: usuario atualiza proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert via trigger (service role) — sem policy de insert para anon/authenticated
-- O trigger handle_new_user usa SECURITY DEFINER, então não precisa de policy de insert.

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. POLICIES — documents
-- ─────────────────────────────────────────────────────────────────────────────

-- Usuário vê APENAS seus próprios documentos
drop policy if exists "documents: usuario le proprios docs" on public.documents;
create policy "documents: usuario le proprios docs"
  on public.documents for select
  using (auth.uid() = user_id);

-- Usuário insere APENAS documentos associados ao próprio user_id
drop policy if exists "documents: usuario insere proprios docs" on public.documents;
create policy "documents: usuario insere proprios docs"
  on public.documents for insert
  with check (auth.uid() = user_id);

-- Usuário NÃO pode deletar (apenas admin via service role)
-- (sem policy de delete = bloqueado por padrão com RLS ativo)

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. POLICIES — courses
-- ─────────────────────────────────────────────────────────────────────────────

-- Qualquer visitante (inclusive anon) pode LER os cursos — necessário para o site público
drop policy if exists "courses: leitura publica" on public.courses;
create policy "courses: leitura publica"
  on public.courses for select
  using (true);

-- Apenas service role (Edge Functions admin) pode INSERT/UPDATE/DELETE
-- Não criamos policy de write para authenticated/anon — bloqueado por padrão.
-- O admin usa a service_role_key exclusivamente dentro das Edge Functions.

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. STORAGE — Bucket "documents" (privado — documentos dos clientes)
-- ─────────────────────────────────────────────────────────────────────────────
-- Execute manualmente no Supabase Dashboard → Storage → New Bucket:
--   Nome: documents
--   Public: OFF (privado)
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--   Max file size: 5242880 (5 MB)
--
-- Ou via SQL:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Policy de upload: usuário autenticado só faz upload na própria pasta
drop policy if exists "documents bucket: usuario faz upload na propria pasta" on storage.objects;
create policy "documents bucket: usuario faz upload na propria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy de leitura: usuário lê apenas seus próprios arquivos
drop policy if exists "documents bucket: usuario le proprios arquivos" on storage.objects;
create policy "documents bucket: usuario le proprios arquivos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy de delete: usuário pode remover apenas seus próprios arquivos
drop policy if exists "documents bucket: usuario deleta proprios arquivos" on storage.objects;
create policy "documents bucket: usuario deleta proprios arquivos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. STORAGE — Bucket "course-images" (público — imagens dos cursos)
--     SEPARADO do bucket "documents" para não misturar permissões.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-images',
  'course-images',
  true,
  10485760,  -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Policy de leitura pública para imagens de cursos
drop policy if exists "course-images: leitura publica" on storage.objects;
create policy "course-images: leitura publica"
  on storage.objects for select
  using (bucket_id = 'course-images');

-- Apenas service role (admin) faz upload de imagens de cursos
-- (sem policy de insert para anon/authenticated = bloqueado)

-- ─────────────────────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- ─────────────────────────────────────────────────────────────────────────────
