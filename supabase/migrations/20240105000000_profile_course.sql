-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: curso escolhido no perfil do usuário particular
-- ══════════════════════════════════════════════════════════════════════════════
-- Adiciona os campos course_slug e course_name à tabela profiles.
-- Para contas Empresa, o curso já está em company_enrollees.course.
-- Para contas Particular, o curso é capturado no momento do upload de documentos
-- e salvo diretamente no perfil.
-- ══════════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists course_slug text,
  add column if not exists course_name text;

comment on column public.profiles.course_slug is
  'Slug do curso escolhido pelo usuário particular durante a matrícula.';
comment on column public.profiles.course_name is
  'Nome do curso escolhido pelo usuário particular durante a matrícula.';
