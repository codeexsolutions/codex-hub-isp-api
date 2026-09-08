-- Campos extras da Landing Page — endereço (footer) e prova social opcional
-- (nota do Google). Tudo opcional: a LP funciona sem nenhum desses.
ALTER TABLE provedor_lp_config ADD COLUMN IF NOT EXISTS endereco VARCHAR(200) NULL;
ALTER TABLE provedor_lp_config ADD COLUMN IF NOT EXISTS nota_google NUMERIC(2,1) NULL;
ALTER TABLE provedor_lp_config ADD COLUMN IF NOT EXISTS qtd_avaliacoes_google INTEGER NULL;
ALTER TABLE provedor_lp_config ADD COLUMN IF NOT EXISTS link_google VARCHAR(200) NULL;
