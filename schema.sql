-- Esquema do banco — App de Gastos (Supabase)
-- Cole tudo no SQL Editor do Supabase (New query) e clique em RUN.
--
-- Modelo: um registro por usuário guardando todos os dados (categorias + lançamentos)
-- como JSON, com carimbo de hora para sincronização "vence o mais recente" (last-write-wins).
-- É simples e robusto para uso pessoal entre os seus próprios aparelhos.

create table if not exists gastos_dados (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  dados      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Segurança: cada usuário só acessa os próprios dados (OBRIGATÓRIO).
alter table gastos_dados enable row level security;

drop policy if exists "dono acessa seus dados" on gastos_dados;
create policy "dono acessa seus dados"
  on gastos_dados for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sincronização em tempo real entre dispositivos.
alter publication supabase_realtime add table gastos_dados;
