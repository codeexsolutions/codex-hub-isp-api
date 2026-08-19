-- Fase 3 (recorte inicial): pontos como benefício + recompensas configuradas pelo provedor.
-- Anda junto do módulo "beneficios" já existente (só ganha pontos quem compra).
-- Rode manualmente no Postgres/Supabase (mesmo banco das tabelas das Fases 1/2).

-- Taxa global de conversão (pontos por R$1 gasto), configurável pelo admin.
CREATE TABLE IF NOT EXISTS config_pontos (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    pontos_por_real NUMERIC(6,2) NOT NULL DEFAULT 1,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO config_pontos (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Catálogo de recompensas que cada provedor cadastra (texto livre — desconto, benefício, o que quiser).
CREATE TABLE IF NOT EXISTS pontos_recompensas (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    pontos_necessarios INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pontos_recompensas_provedor ON pontos_recompensas (codigo_provedor_fk);

-- Ledger de pontos: uma linha por evento (ganho numa compra, ou resgate de recompensa).
-- Saldo do cliente = SUM(pontos) desse ledger, sem coluna de saldo separada (evita drift).
CREATE TABLE IF NOT EXISTS pontos_extrato (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    cliente_cpf_cnpj VARCHAR(20) NOT NULL,
    cliente_nome VARCHAR(150),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ganho', 'resgate')),
    pontos INTEGER NOT NULL,
    origem_compra_id INTEGER NULL REFERENCES beneficio_compras(id),
    origem_recompensa_id INTEGER NULL REFERENCES pontos_recompensas(id),
    cupom_codigo VARCHAR(12) NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pontos_extrato_cliente ON pontos_extrato (codigo_provedor_fk, cliente_cpf_cnpj);
