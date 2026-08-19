-- Pontos concedidos pelo provedor por fora da compra de benefício: pagamento em dia
-- (concessão manual, digitando a quantidade) e indicação de amigo efetivada (concessão
-- automática ao marcar a indicação, usando o valor padrão configurado abaixo).
-- Rode manualmente no Postgres/Supabase (mesmo banco das tabelas da Fase 3).

-- Indicação precisa do CPF/CNPJ de quem indicou pra saber a quem creditar os pontos
-- quando ela for marcada como efetivada, e de um status pra não creditar duas vezes.
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS cliente_cpf_cnpj VARCHAR(20) NULL;
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','efetivada'));
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS pontos_creditados BOOLEAN NOT NULL DEFAULT false;

-- Rastreio de origem pra concessões que não vêm de uma compra: indicação efetivada
-- (origem_indicacao_id) ou motivo livre digitado pelo provedor (ex.: "Pagamento em dia").
ALTER TABLE pontos_extrato ADD COLUMN IF NOT EXISTS origem_indicacao_id INTEGER NULL REFERENCES indicacoes(id);
ALTER TABLE pontos_extrato ADD COLUMN IF NOT EXISTS motivo VARCHAR(150) NULL;

-- Pontos padrão sugeridos quando uma indicação é marcada como efetivada.
ALTER TABLE config_pontos ADD COLUMN IF NOT EXISTS pontos_indicacao_efetivada INTEGER NOT NULL DEFAULT 50;
