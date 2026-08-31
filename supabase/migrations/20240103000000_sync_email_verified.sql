-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: sincronizar email_confirmed_at com profiles.email_verified
-- ══════════════════════════════════════════════════════════════════════════════
-- Quando o usuário confirma o e-mail via OTP nativo do Supabase,
-- o campo auth.users.email_confirmed_at é preenchido automaticamente.
-- Este trigger propaga isso para public.profiles.email_verified = true.
--
-- Remove também as RPCs generate_verification_code e verify_email,
-- que foram substituídas pelo OTP nativo do Supabase Auth.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger: sincroniza email_confirmed_at → profiles.email_verified
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Quando email_confirmed_at for preenchido (usuário confirmou o e-mail),
  -- marca email_verified = true no profile correspondente.
  if new.email_confirmed_at is not null and
     (old.email_confirmed_at is null or old.email_confirmed_at != new.email_confirmed_at) then
    update public.profiles
    set email_verified = true
    where id = new.id;
  end if;
  return new;
end;
$$;

-- Dispara após UPDATE na tabela auth.users (quando email_confirmed_at muda)
drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute procedure public.sync_email_verified();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Remover RPCs customizadas que não eram utilizadas e geravam erros 404
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.generate_verification_code();
drop function if exists public.verify_email(text);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Sincronizar retroativamente usuários que já confirmaram o e-mail
-- ─────────────────────────────────────────────────────────────────────────────
-- Atualiza profiles existentes cujo usuário já tem email_confirmed_at preenchido.

update public.profiles p
set email_verified = true
from auth.users u
where p.id = u.id
  and u.email_confirmed_at is not null
  and p.email_verified = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIM DA MIGRATION
-- ─────────────────────────────────────────────────────────────────────────────
