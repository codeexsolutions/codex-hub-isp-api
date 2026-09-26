-- Domínio/URL do painel MK-Auth do provedor (mesmo papel de dominio_ixc,
-- mas em coluna própria — cada provedor usa só um gerenciador por vez, mas
-- não vale reaproveitar a coluna existente pra não arriscar a integração
-- IXC já em produção). A integração real ainda não está implementada (ver
-- ApiMkAuthService.ts) — esta coluna só deixa o cadastro pronto pra quando
-- tivermos os dados de acesso do MK-Auth do cliente.
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS dominio_mkauth VARCHAR(160) NULL;

-- Client_Id do MK-Auth é uma string hex longa (ex.: "Client_Id_662eaa47...") —
-- não cabe em codigo_api_gerenciador (bigint, usado pelo IXC). O Client_Secret
-- reaproveita chave_api_gerenciador (já é text, mesmo papel que tem pro IXC).
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS mkauth_client_id TEXT NULL;
