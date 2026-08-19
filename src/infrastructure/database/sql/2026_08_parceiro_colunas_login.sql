-- A tabela "parceiros" já existia no banco (de um recurso anterior, sem código que a use
-- hoje — 0 linhas), com colunas diferentes das que o portal do parceiro precisa
-- (nome_parceiro em vez de nome, sem usuario/senha, created_at em vez de criado_em).
-- Em vez de recriar, só adiciona o que falta pro login funcionar.

ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS usuario VARCHAR(100) UNIQUE;
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS senha VARCHAR(100);
