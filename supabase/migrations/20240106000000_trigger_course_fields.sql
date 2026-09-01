-- ══════════════════════════════════════════════════════════════════════════════
-- PHAROS — Migration: trigger handle_new_user lê course_slug/course_name
-- ══════════════════════════════════════════════════════════════════════════════
-- O signUp passa course_slug e course_name nos user_metadata.
-- Este trigger atualizado os insere diretamente no INSERT do profile,
-- eliminando a race condition entre o trigger e o UPDATE posterior.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    phone,
    account_type,
    company_name,
    cnpj,
    course_slug,
    course_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'account_type', 'particular'),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'course_slug',
    new.raw_user_meta_data->>'course_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
