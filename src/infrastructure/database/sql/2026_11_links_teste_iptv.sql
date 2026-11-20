-- Links do chatbot DEYLER+ (ou outro fornecedor) que geram um teste IPTV
-- (usuário/senha/dns temporários) pro cadastro novo do synk-tv. Existe mais
-- de um "tipo" (com/sem adultos, jogos, apps parceiros específicos) — cada
-- linha aqui é um desses tipos, cadastrado manualmente pelo admin a partir
-- da tela de configuração do próprio bot.
--
-- `padrao`: qual desses é usado automaticamente quando um cliente cria
-- conta no synk-tv hoje (sem o cliente escolher o tipo). Só um por vez —
-- garantido também a nível de banco pelo índice único parcial abaixo.
CREATE TABLE IF NOT EXISTS links_teste_iptv (
    id SERIAL PRIMARY KEY,
    rotulo VARCHAR(160) NOT NULL,
    url TEXT NOT NULL,
    padrao BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_teste_iptv_unico_padrao
    ON links_teste_iptv (padrao) WHERE padrao;
