-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: adiciona tipo 'dispensa' à tabela documents
-- ══════════════════════════════════════════════════════════════════════════════

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
      'oficio',
      'dispensa'
    )
  );

comment on column public.documents.document_type is
  'Tipo do documento: cnh | rg | titulo_eleitor | comprovante_residencia | certidao | oficio | dispensa';
