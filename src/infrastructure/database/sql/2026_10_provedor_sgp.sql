-- Domínio/URL do painel SGP do provedor (mesmo papel de dominio_ixc/dominio_mkauth).
-- A integração real ainda não está implementada (ver ApiSgpService.ts) — esta
-- coluna só deixa o cadastro pronto pra quando tivermos o contrato real da
-- API do SGP (hoje documentada via Postman em sgp.net.br, mas ainda não
-- extraída). Credenciais (token/app) reaproveitam chave_api_gerenciador e
-- codigo_api_gerenciador, mesmo padrão já usado pelo IXC.
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS dominio_sgp VARCHAR(160) NULL;
