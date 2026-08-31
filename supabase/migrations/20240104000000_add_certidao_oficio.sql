-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: adiciona tipos de documento certidao e oficio
-- ══════════════════════════════════════════════════════════════════════════════
-- Amplia a constraint documents_type_check para aceitar os novos tipos:
--   certidao  → exigido de todos os usuários (particular e empresa)
--   oficio    → exigido apenas de usuários com account_type = 'empresa'
--
-- A lógica de quem vê qual documento é controlada no frontend (UploadDocs.tsx).
-- O banco aceita ambos os tipos e o RLS garante que cada usuário só acessa
-- seus próprios documentos.
-- ══════════════════════════════════════════════════════════════════════════════

-- Remove a constraint antiga e cria uma nova com os 6 tipos
alter table public.documents
  drop constraint if exists documents_type_check;

alter table public.documents
  add constraint documents_type_check check (
    document_type in (
      'cnh',
      'rg',
      'titulo_eleitor',
      'comprovante_residencia',
      'certidao',
      'oficio'
    )
  );

comment on column public.documents.document_type is
  'Tipo do documento: cnh | rg | titulo_eleitor | comprovante_residencia | certidao | oficio';
