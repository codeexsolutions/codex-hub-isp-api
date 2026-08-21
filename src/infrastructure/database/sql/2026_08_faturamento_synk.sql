-- Cobrança da mensalidade que o provedor paga pra Synk (não confundir com a comissão
-- de vendas de benefícios — isso é a taxa de uso da plataforma). Rode manualmente no
-- Postgres/Supabase.

-- Config PIX global da Synk (singleton, mesmo padrão de config_comissao/config_pontos) —
-- uma única chave/recebedor pra todos os provedores; só valor e vencimento variam por provedor.
CREATE TABLE IF NOT EXISTS synk_pix_config (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    chave_pix VARCHAR(140) NOT NULL DEFAULT '',
    nome_recebedor VARCHAR(25) NOT NULL DEFAULT 'SYNK SOLUCOES',
    cidade VARCHAR(15) NOT NULL DEFAULT 'FORTALEZA',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO synk_pix_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Assinatura do provedor com a Synk (1 linha por provedor). O dia de vencimento mensal
-- é EXTRACT(DAY FROM data_adesao) — calculado na hora, sem coluna redundante.
CREATE TABLE IF NOT EXISTS provedor_assinaturas (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL UNIQUE REFERENCES provedores(codigo_provedor),
    valor_mensalidade NUMERIC(10,2) NOT NULL,
    data_adesao DATE NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parcelas mensais. Só 3 status guardados — "vencido"/"a vencer" são calculados na hora
-- a partir de vencimento vs. hoje (pendente + vencimento < hoje = vencido/atrasado).
CREATE TABLE IF NOT EXISTS provedor_faturas (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    competencia DATE NOT NULL,
    vencimento DATE NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
    pago_em TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (codigo_provedor_fk, competencia)
);
CREATE INDEX IF NOT EXISTS idx_provedor_faturas_provedor ON provedor_faturas (codigo_provedor_fk);
