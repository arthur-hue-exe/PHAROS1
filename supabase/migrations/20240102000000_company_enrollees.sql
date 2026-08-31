-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: suporte a contas empresariais e pré-matrículas
-- ══════════════════════════════════════════════════════════════════════════════
-- Execute no SQL Editor do Supabase Dashboard APÓS a migration inicial.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Adicionar colunas na tabela profiles
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists account_type  text not null default 'particular'
    constraint profiles_account_type_check check (account_type in ('particular', 'empresa')),
  add column if not exists company_name  text,   -- razão social / nome fantasia
  add column if not exists cnpj          text;   -- CNPJ formatado (ex: 12.345.678/0001-90)

comment on column public.profiles.account_type is
  '"particular" = pessoa física | "empresa" = conta empresarial com múltiplos candidatos';
comment on column public.profiles.company_name is
  'Razão social ou nome fantasia da empresa (preenchido apenas quando account_type = empresa)';
comment on column public.profiles.cnpj is
  'CNPJ da empresa formatado (preenchido apenas quando account_type = empresa)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabela company_enrollees — pré-matrículas da empresa
--    Cada linha = um candidato vinculado à conta da empresa.
--    Não cria usuário no Auth — a conta da empresa é uma só.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.company_enrollees (
  id           uuid        primary key default uuid_generate_v4(),
  company_id   uuid        not null references public.profiles(id) on delete cascade,
  name         text        not null,
  cpf          text,
  phone        text,
  course       text,        -- título do curso escolhido
  course_slug  text,        -- slug do curso (para referência)
  notes        text,        -- observações livres
  status       text        not null default 'pending'
    constraint enrollees_status_check check (status in ('pending', 'confirmed', 'cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.company_enrollees is
  'Pré-matrículas de candidatos vinculados a uma conta empresarial. Uma empresa pode ter N candidatos.';
comment on column public.company_enrollees.company_id is
  'FK para profiles.id — a conta da empresa que cadastrou este candidato';
comment on column public.company_enrollees.status is
  '"pending" = aguardando confirmação | "confirmed" = confirmado | "cancelled" = cancelado';

-- Trigger: atualiza updated_at automaticamente
drop trigger if exists company_enrollees_updated_at on public.company_enrollees;
create trigger company_enrollees_updated_at
  before update on public.company_enrollees
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS na nova tabela
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.company_enrollees enable row level security;

-- Empresa lê apenas seus próprios candidatos
drop policy if exists "enrollees: empresa le proprios candidatos" on public.company_enrollees;
create policy "enrollees: empresa le proprios candidatos"
  on public.company_enrollees for select
  using (auth.uid() = company_id);

-- Empresa insere candidatos apenas para sua própria conta
drop policy if exists "enrollees: empresa insere proprios candidatos" on public.company_enrollees;
create policy "enrollees: empresa insere proprios candidatos"
  on public.company_enrollees for insert
  with check (auth.uid() = company_id);

-- Empresa atualiza apenas seus próprios candidatos
drop policy if exists "enrollees: empresa atualiza proprios candidatos" on public.company_enrollees;
create policy "enrollees: empresa atualiza proprios candidatos"
  on public.company_enrollees for update
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

-- Empresa remove apenas seus próprios candidatos
drop policy if exists "enrollees: empresa remove proprios candidatos" on public.company_enrollees;
create policy "enrollees: empresa remove proprios candidatos"
  on public.company_enrollees for delete
  using (auth.uid() = company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- ─────────────────────────────────────────────────────────────────────────────
