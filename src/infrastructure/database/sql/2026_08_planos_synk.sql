-- Planos de venda do Synk (pacotes de módulos + valor) — o admin escolhe um
-- plano ao configurar a assinatura do provedor, em vez de digitar valor e
-- ativar módulo por módulo manualmente. "Sem plano" continua existindo
-- (plano_id nulo) pra assinaturas personalizadas fora da régua padrão.
CREATE TABLE IF NOT EXISTS planos_synk (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(40) NOT NULL,
    valor_mensalidade NUMERIC(10,2) NOT NULL,
    modulos TEXT[] NOT NULL DEFAULT '{}',
    ordem SMALLINT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE provedor_assinaturas ADD COLUMN IF NOT EXISTS plano_id INTEGER REFERENCES planos_synk(id);

-- Semente inicial (só roda se a tabela ainda estiver vazia) — valores/nomes
-- são só um ponto de partida, ajustáveis depois pelo admin.
INSERT INTO planos_synk (nome, valor_mensalidade, modulos, ordem)
SELECT * FROM (VALUES
    ('Básico', 49.90, ARRAY['beneficios']::text[], 1),
    ('Profissional', 99.90, ARRAY['beneficios','recompensas']::text[], 2),
    ('Enterprise', 199.90, ARRAY['beneficios','recompensas','desbloqueio_confianca']::text[], 3)
) AS v(nome, valor_mensalidade, modulos, ordem)
WHERE NOT EXISTS (SELECT 1 FROM planos_synk);
