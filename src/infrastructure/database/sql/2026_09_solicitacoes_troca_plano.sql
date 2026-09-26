-- Solicitação de troca do plano de internet (fibra) — cliente pede upgrade
-- direto pelo app; o provedor confirma e executa a troca manualmente no
-- próprio gerenciador (IXC/ReceitaNet/MK-Auth). Mesmo formato de
-- solicitacoes_planos_moveis, tabela própria porque é sobre o catálogo
-- planos_internet (Vitrine de Planos), não planos_moveis.
CREATE TABLE IF NOT EXISTS solicitacoes_troca_plano (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL,
    plano_id_fk INTEGER NULL,
    plano_nome VARCHAR(160) NOT NULL,
    plano_valor NUMERIC(10,2) NOT NULL,
    cliente_cpf_cnpj VARCHAR(20) NOT NULL,
    cliente_nome VARCHAR(160) NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','atendida','cancelada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_troca_plano_provedor ON solicitacoes_troca_plano (codigo_provedor_fk);
