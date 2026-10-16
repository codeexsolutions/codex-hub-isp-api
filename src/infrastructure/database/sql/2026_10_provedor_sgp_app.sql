-- Nome do App cadastrado no SGP (Sistema -> Ferramentas -> Painel Admin ->
-- Tokens), usado junto com chave_api_gerenciador (que guarda o Token) pra
-- autenticar via App+Token na API do SGP (ver ApiSgpService.ts). Não cabe em
-- codigo_api_gerenciador (bigint, usado pelo IXC) porque o nome do App no SGP
-- é alfanumérico (ex.: "tsmx", "sgp"), não numérico — mesmo motivo que levou
-- a criar mkauth_client_id em vez de reaproveitar aquela coluna.
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS sgp_app TEXT NULL;
