-- Mesmo padrão de push_subscription_painel/notificacao_painel (sino do
-- provedor), só que pro PARCEIRO — usado pra avisar quando um cliente compra
-- uma das ofertas dele.
CREATE TABLE IF NOT EXISTS push_subscription_parceiro (
    id SERIAL PRIMARY KEY,
    parceiro_id INTEGER NOT NULL REFERENCES parceiros(id),
    endpoint TEXT NOT NULL,
    auth VARCHAR(255) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parceiro_id, endpoint)
);

CREATE TABLE IF NOT EXISTS notificacao_parceiro (
    id SERIAL PRIMARY KEY,
    parceiro_id INTEGER NOT NULL REFERENCES parceiros(id),
    tipo VARCHAR(40) NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    corpo TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificacao_parceiro_parceiro ON notificacao_parceiro (parceiro_id);
