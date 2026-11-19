-- Marcadores de abertura e créditos (estilo Netflix: "Pular abertura",
-- "Próximo episódio") achados pelo worker de src/api/controllers/marcadores.
-- Chave = o vídeo no painel IPTV (host do servidor + tipo + id), nunca a conta
-- de quem pediu: o resultado serve pra todo mundo daquele servidor.
-- fp_inicio/fp_fim: impressão digital do áudio do começo/fim (uint32 por
-- quadro de 0,064 s) — guardada pra comparar com episódios que chegarem
-- depois sem baixar de novo os antigos.
-- A API cria a tabela sozinha no primeiro uso (mesmo SQL); este arquivo fica
-- pra registro, como as outras migrações.
CREATE TABLE IF NOT EXISTS marcadores_midia (
    servidor VARCHAR(255) NOT NULL,
    tipo VARCHAR(8) NOT NULL CHECK (tipo IN ('episodio','filme')),
    midia_id VARCHAR(40) NOT NULL,
    serie_id INTEGER,
    temporada INTEGER,
    numero INTEGER,
    duracao REAL,
    fp_inicio BYTEA,
    fp_fim BYTEA,
    fim_inicio REAL,
    creditos_imagem REAL,
    abertura_inicio REAL,
    abertura_fim REAL,
    creditos_inicio REAL,
    fonte_creditos VARCHAR(8) CHECK (fonte_creditos IN ('audio','imagem')),
    erro VARCHAR(40),
    analisado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (servidor, tipo, midia_id)
);
CREATE INDEX IF NOT EXISTS idx_marcadores_temporada ON marcadores_midia (servidor, serie_id, temporada);
