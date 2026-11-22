-- Fichas do TMDB guardadas DE VEZ (sinopse da série, nota, gêneros, pôster,
-- fundo; e nome/resumo/imagem dos episódios de cada temporada). Antes ficavam
-- só no cache em memória (24h), que some a cada deploy/reinício do Railway.
-- chave = a consulta ("serie|v1|suits|2011|anime" ou "episodios|v1|...|1");
-- o "v1" muda quando a regra de escolha da série mudar (invalida tudo).
-- A API cria a tabela sozinha no primeiro uso (mesmo SQL).
CREATE TABLE IF NOT EXISTS tmdb_fichas (
    chave VARCHAR(400) PRIMARY KEY,
    valor JSONB NOT NULL,
    salvo_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
