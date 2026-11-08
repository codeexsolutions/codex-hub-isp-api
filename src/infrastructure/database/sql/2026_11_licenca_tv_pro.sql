-- Tier "Pro" da licença do synk-tv (venda avulsa): além do uso do app,
-- libera sincronizar histórico/perfil entre aparelhos (ver perfil_tv_sync).
-- "normal" continua sendo o valor já existente em config_licenca_tv.valor_anual.
ALTER TABLE licencas_tv ADD COLUMN IF NOT EXISTS tier VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (tier IN ('normal','pro'));
ALTER TABLE config_licenca_tv ADD COLUMN IF NOT EXISTS valor_anual_pro NUMERIC(10,2) NOT NULL DEFAULT 49.90;

-- Sync de histórico/perfil pra quem tem licença Pro — 1 linha por licença,
-- guarda os mesmos arrays já salvos localmente no aparelho (ver
-- apps/web-tv|mobile-tv/src/api/historico.ts), sem normalizar em tabelas.
-- "Último a salvar ganha" é resolvido na aplicação comparando atualizado_em
-- (o enviado pelo cliente) com o já salvo, não aqui no banco.
CREATE TABLE IF NOT EXISTS perfil_tv_sync (
    licenca_tv_id INTEGER PRIMARY KEY REFERENCES licencas_tv (id) ON DELETE CASCADE,
    historico_filmes JSONB NOT NULL DEFAULT '[]'::jsonb,
    historico_series JSONB NOT NULL DEFAULT '[]'::jsonb,
    interacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
