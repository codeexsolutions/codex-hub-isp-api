-- Pagamento da comissão que o parceiro deve pra Synk+provedor (referente às
-- vendas validadas no mês fechado). Mesmo padrão do faturamento Synk: mês
-- fechado é cobrado no dia combinado do mês seguinte, PIX estático, admin
-- confirma o pagamento manualmente.
ALTER TABLE config_comissao ADD COLUMN IF NOT EXISTS dia_pagamento SMALLINT NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS parceiro_comissao_faturas (
    id SERIAL PRIMARY KEY,
    parceiro_id_fk INTEGER NOT NULL REFERENCES parceiros(id),
    competencia DATE NOT NULL,
    vencimento DATE NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
    pago_em TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parceiro_id_fk, competencia)
);
CREATE INDEX IF NOT EXISTS idx_parceiro_comissao_faturas_parceiro ON parceiro_comissao_faturas (parceiro_id_fk);
