-- PIX próprio da licença do app Synk TV — separado do synk_pix_config (usado
-- em Faturamento/Comissão), porque é outra chave/recebedor.
ALTER TABLE config_licenca_tv ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(140) NOT NULL DEFAULT '';
ALTER TABLE config_licenca_tv ADD COLUMN IF NOT EXISTS nome_recebedor VARCHAR(25) NOT NULL DEFAULT 'SYNK SOLUCOES';
ALTER TABLE config_licenca_tv ADD COLUMN IF NOT EXISTS cidade VARCHAR(15) NOT NULL DEFAULT 'FORTALEZA';
