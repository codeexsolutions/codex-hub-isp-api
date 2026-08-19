-- "Usuários ativos" do Dashboard: uma linha por cliente (não por login), com upsert do
-- último acesso — evita crescimento ilimitado de uma tabela de eventos de login.
-- "Clientes conectados" continua impossível de obter: ReceitaNet/IXC só respondem
-- consulta por cliente individual (CPF/token), não existe endpoint de listagem em massa.

CREATE TABLE IF NOT EXISTS cliente_atividade (
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    cliente_cpf_cnpj VARCHAR(20) NOT NULL,
    cliente_nome VARCHAR(150),
    ultimo_login TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (codigo_provedor_fk, cliente_cpf_cnpj)
);
