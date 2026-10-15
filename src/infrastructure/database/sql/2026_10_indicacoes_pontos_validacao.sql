-- Data de efetivação da indicação, pra exibir ao lado da data em que foi feita
-- (que já existe como created_at, só não era mostrada no painel).
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS efetivado_em TIMESTAMPTZ NULL;

-- Validação do cupom de resgate de pontos (pontos_extrato.cupom_codigo) — o cliente
-- recebe esse código ao resgatar uma recompensa, mas até então não existia onde o
-- provedor confirmasse/marcasse que o cupom foi usado.
ALTER TABLE pontos_extrato ADD COLUMN IF NOT EXISTS cupom_usado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pontos_extrato ADD COLUMN IF NOT EXISTS cupom_usado_em TIMESTAMPTZ NULL;
