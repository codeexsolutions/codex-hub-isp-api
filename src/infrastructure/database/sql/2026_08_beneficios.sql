-- Fase 1 (Central de Benefícios): tabela nova para o CRUD de Benefícios do painel
-- e leitura pública no app. Não há mecanismo de migration no projeto — rode manualmente
-- no Postgres/Supabase (mesmo banco usado por marketing_anuncios/marketing_banners).

CREATE TABLE IF NOT EXISTS marketing_beneficios (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(40) NOT NULL,
    parceiro VARCHAR(150) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    subtitulo VARCHAR(150),
    descricao TEXT,
    link_imagem TEXT,
    link_acao TEXT,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_beneficios_provedor
    ON marketing_beneficios (codigo_provedor_fk);
