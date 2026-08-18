-- Tabela de propostas.
--
-- `caminho` é gerada: é contra ela que a URL pública é comparada, e o índice
-- único nela é o que impede duas propostas com o mesmo endereço.
create table if not exists propostas (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  token text not null,
  caminho text generated always as (slug || '-' || token) stored,
  titulo_projeto text not null,
  status text not null default 'rascunho',
  cliente jsonb not null,
  emitida_em date not null,
  valida_ate date not null,
  conteudo jsonb not null,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create unique index if not exists propostas_slug_unico on propostas (slug);
create unique index if not exists propostas_caminho_unico on propostas (caminho);

-- O acesso do app é 100% server-side, com a conexão direta do Postgres, então
-- não existe policy nenhuma para escrever. Mas a API PostgREST do Supabase
-- publica o schema `public` para a chave anônima, e sem RLS a tabela inteira
-- (com os tokens das propostas) ficaria legível por quem tivesse essa chave.
-- RLS ligada e ZERO policies fecha a API; o dono da tabela, que é quem o app
-- usa, continua passando normalmente.
alter table propostas enable row level security;
revoke all on table propostas from anon, authenticated;
