-- Solicitação de plano móvel — fluxo próprio do Synk, independente do
-- sistema de chamados do gerenciador (ReceitaNet/IXC). Evita a limitação de
-- "só 1 chamado aberto por vez" do ReceitaNet, que fazia a solicitação
-- falhar com 403 sempre que o cliente já tinha outro chamado em aberto.
-- Snapshot do plano (nome/valor) no momento da solicitação — não depende de
-- o plano continuar existindo/ativo depois.
CREATE TABLE IF NOT EXISTS solicitacoes_planos_moveis (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    plano_id_fk INTEGER REFERENCES planos_moveis(id),
    plano_nome VARCHAR(30) NOT NULL,
    plano_valor NUMERIC(10,2) NOT NULL,
    cliente_cpf_cnpj VARCHAR(20) NOT NULL,
    cliente_nome VARCHAR(150),
    status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','atendida','cancelada')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_planos_moveis_provedor ON solicitacoes_planos_moveis (codigo_provedor_fk, criado_em DESC);
