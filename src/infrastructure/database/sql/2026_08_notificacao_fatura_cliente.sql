-- Controle de notificações push de fatura do cliente (D-3, no dia, D+1),
-- evita reenviar o mesmo aviso toda vez que a varredura periódica rodar.
CREATE TABLE IF NOT EXISTS notificacao_fatura_cliente (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(20) NOT NULL,
    codigo_provedor VARCHAR(20) NOT NULL,
    fatura_id VARCHAR(40) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('D3','HOJE','D1')),
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cpf, codigo_provedor, fatura_id, tipo)
);
