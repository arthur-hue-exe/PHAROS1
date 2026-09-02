-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: campo print_requested na tabela documents
-- ══════════════════════════════════════════════════════════════════════════════
-- Armazena se o usuário solicitou impressão da Certidão.
-- Só é relevante para document_type = 'certidao', mas o campo fica na tabela
-- para não criar uma tabela separada desnecessariamente.
-- Para os demais tipos de documento o valor permanece false (padrão).
-- ══════════════════════════════════════════════════════════════════════════════

alter table public.documents
  add column if not exists print_requested boolean not null default false;

comment on column public.documents.print_requested is
  'true = usuário solicitou impressão (válido apenas para certidao). false = não solicitou.';
