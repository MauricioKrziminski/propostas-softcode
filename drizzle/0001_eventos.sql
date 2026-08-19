-- Eventos da proposta: uma linha por ação do cliente.
--
-- O índice único em (proposta_id, tipo, chave) NÃO é higiene de banco, é a regra
-- de negócio: a inserção é `on conflict do nothing`, e o e-mail para a SoftCode
-- só é disparado quando uma linha realmente nasce. Sem ele, cada F5 do cliente
-- viraria um e-mail, e a caixa de entrada aprenderia a ignorar justamente o
-- aviso que importa.
--
-- Quem define o intervalo de repetição é a `chave`, decidida por tipo:
--   · `convite_aberto`, `proposta_aberta`, `pdf_baixado` usam a DATA, então
--     repetem no dia seguinte e não a cada recarga;
--   · `aceite` usa um valor único por clique, porque aceite deduplicado é venda
--     perdida em silêncio.
--
-- `on delete cascade` porque evento sem proposta não significa nada, e o painel
-- já permite excluir proposta.
create table if not exists proposta_eventos (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references propostas (id) on delete cascade,
  tipo text not null,
  chave text not null,
  detalhe jsonb,
  ip text,
  user_agent text,
  criado_em timestamptz not null default now()
);

create unique index if not exists proposta_eventos_unico
  on proposta_eventos (proposta_id, tipo, chave);

-- Consulta do painel: os eventos de UMA proposta, do mais recente para o mais
-- antigo. Sem este índice seria varredura da tabela inteira.
create index if not exists proposta_eventos_por_proposta
  on proposta_eventos (proposta_id, criado_em);

-- Mesma razão da tabela `propostas`: o acesso do app é server-side com a conexão
-- direta, mas a API PostgREST do Supabase publica o schema `public` para a chave
-- anônima. Sem RLS, o IP e o user-agent de quem aceitou proposta ficariam
-- legíveis por quem tivesse essa chave. RLS ligada e ZERO policies fecha a API.
alter table proposta_eventos enable row level security;
revoke all on table proposta_eventos from anon, authenticated;
