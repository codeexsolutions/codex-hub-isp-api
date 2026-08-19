-- Fase 2 (Marketplace): compra registrada + cupom + comissionamento, sem gateway de
-- pagamento ainda. Rode manualmente no Postgres/Supabase (mesmo banco das tabelas da Fase 1).

-- Só benefícios com valor preenchido viram "compráveis" no app; os demais continuam
-- só com o botão "Aproveitar benefício" (redirecionamento), como hoje.
ALTER TABLE marketing_beneficios ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2);

-- Split de comissão em percentual fixo global, configurável pela tela de admin.
CREATE TABLE IF NOT EXISTS config_comissao (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    percentual_parceiro NUMERIC(5,2) NOT NULL DEFAULT 80,
    percentual_synk NUMERIC(5,2) NOT NULL DEFAULT 12,
    percentual_provedor NUMERIC(5,2) NOT NULL DEFAULT 8,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO config_comissao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Cliente não tem tabela própria no Synk (vem do gerenciador externo), por isso
-- cliente_nome/cliente_cpf_cnpj são colunas denormalizadas, mesmo padrão já usado
-- em avaliacao_servico/indicacoes.
CREATE TABLE IF NOT EXISTS beneficio_compras (
    id SERIAL PRIMARY KEY,
    beneficio_id INTEGER NOT NULL REFERENCES marketing_beneficios(id),
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    cliente_nome VARCHAR(150) NOT NULL,
    cliente_cpf_cnpj VARCHAR(20) NOT NULL,
    cupom_codigo VARCHAR(12) NOT NULL UNIQUE,
    valor NUMERIC(10,2) NOT NULL,
    percentual_parceiro NUMERIC(5,2) NOT NULL,
    percentual_synk NUMERIC(5,2) NOT NULL,
    percentual_provedor NUMERIC(5,2) NOT NULL,
    valor_parceiro NUMERIC(10,2) NOT NULL,
    valor_synk NUMERIC(10,2) NOT NULL,
    valor_provedor NUMERIC(10,2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficio_compras_provedor
    ON beneficio_compras (codigo_provedor_fk);
CREATE INDEX IF NOT EXISTS idx_beneficio_compras_cliente
    ON beneficio_compras (cliente_cpf_cnpj);
