-- Central de notificações do cliente (sino do app): guarda o conteúdo de toda
-- notificação push enviada (broadcast do provedor ou aviso individual de fatura)
-- pra poder listar, marcar como lida e excluir dentro do app.
CREATE TABLE IF NOT EXISTS notificacao_cliente (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(20) NOT NULL,
    codigo_provedor VARCHAR(20) NOT NULL,
    titulo VARCHAR(140) NOT NULL,
    corpo TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificacao_cliente_cpf ON notificacao_cliente (cpf, codigo_provedor);
