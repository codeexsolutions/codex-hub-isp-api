-- Ciclo de vida do cupom (pendente/utilizado/cancelado) + entidade Parceiro com login próprio.
-- Rode manualmente no Postgres/Supabase (mesmo banco das tabelas anteriores).

-- Status da compra: só "utilizado" conta pra comissão/vendas/pontos.
ALTER TABLE beneficio_compras ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','utilizado','cancelado'));
ALTER TABLE beneficio_compras ADD COLUMN IF NOT EXISTS validado_em TIMESTAMPTZ NULL;

-- Migração: compras feitas ANTES dessa feature existir já contavam nos relatórios —
-- marca todas como "utilizado" agora, pra não zerar retroativamente números já vistos.
-- Só as compras novas (a partir de agora) nascem "pendente".
UPDATE beneficio_compras SET status = 'utilizado', validado_em = criado_em WHERE status = 'pendente';

-- Entidade Parceiro: login próprio (usuário/senha, mesmo padrão sem hash do resto do projeto).
CREATE TABLE IF NOT EXISTS parceiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vínculo opcional entre um benefício e a conta do parceiro no portal (o campo de texto
-- "parceiro" em marketing_beneficios continua existindo pra exibição, sem mudança).
ALTER TABLE marketing_beneficios ADD COLUMN IF NOT EXISTS parceiro_id_fk INTEGER NULL REFERENCES parceiros(id);
