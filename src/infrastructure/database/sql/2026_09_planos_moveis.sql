-- Catálogo de planos de internet móvel que o provedor oferece — o cliente
-- escolhe um pelo app e a solicitação vira um chamado (ver Suporte no app e
-- o gancho de aviso em Chamado.controller.ts), já que não existe integração
-- automática de provisionamento de linha móvel. Módulo próprio
-- ("planos_moveis"), mesmo padrão de pontos_recompensas.
CREATE TABLE IF NOT EXISTS planos_moveis (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    nome VARCHAR(80) NOT NULL,
    tipo VARCHAR(10) NOT NULL DEFAULT 'movel' CHECK (tipo IN ('movel','combo')),
    gb_plano INTEGER NOT NULL,
    gb_bonus INTEGER NOT NULL DEFAULT 0,
    mega_fibra INTEGER NULL,
    beneficios VARCHAR(200) NULL,
    valor NUMERIC(10,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planos_moveis_provedor ON planos_moveis (codigo_provedor_fk);
