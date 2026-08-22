-- Canais de atendimento configuráveis pelo provedor, exibidos no app do cliente.
-- 1 linha por provedor, tudo opcional (nulo = não exibir aquele canal).
CREATE TABLE IF NOT EXISTS provedor_atendimento (
    codigo_provedor_fk BIGINT PRIMARY KEY REFERENCES provedores(codigo_provedor),
    whatsapp VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(140),
    site VARCHAR(200),
    instagram VARCHAR(60),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
