-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: soft delete (arquivamento) de usuários no painel admin
-- ══════════════════════════════════════════════════════════════════════════════
-- Adiciona o campo is_archived à tabela profiles.
-- Quando is_archived = true o usuário não aparece na lista principal do admin,
-- mas sua conta, documentos e todos os dados permanecem intactos.
-- ══════════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists is_archived   boolean     not null default false,
  add column if not exists archived_at   timestamptz;

comment on column public.profiles.is_archived is
  'true = removido da lista principal do AdminPanel (soft delete). Conta e dados intactos.';
comment on column public.profiles.archived_at is
  'Data/hora em que o administrador removeu o usuário do painel. NULL = ativo.';

-- Índice parcial para acelerar a query da lista principal (apenas ativos)
create index if not exists profiles_active_idx
  on public.profiles (created_at desc)
  where is_archived = false;
