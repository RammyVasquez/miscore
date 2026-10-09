-- Mis finanzas: tabla para sincronizar tus datos.
-- Pégalo completo en Supabase > SQL Editor > New query y pulsa Run (una sola vez).

create table if not exists public.finanzas_docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  doc_id     text        not null,            -- 'config' o 'm-AAAA-MM' (un documento por mes)
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_id)
);

-- Cada persona solo puede ver y cambiar sus propias filas.
alter table public.finanzas_docs enable row level security;

create policy "ver lo mio"     on public.finanzas_docs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "crear lo mio"   on public.finanzas_docs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "editar lo mio"  on public.finanzas_docs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "borrar lo mio"  on public.finanzas_docs for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Cambios en vivo entre tus dispositivos (Realtime).
alter publication supabase_realtime add table public.finanzas_docs;
