-- Licença anual do synk-tv pra quem usa o app "avulso" (sem código de provedor
-- — venda fora da base de provedores do Synk). Provedor com código não passa
-- por aqui: ele já paga o Synk mensal via o faturamento normal.
--
-- A licença não é amarrada a credencial Xtream nem a aparelho — só à própria
-- chave, que o cliente guarda e pode digitar de novo em outro aparelho.
CREATE TABLE IF NOT EXISTS licencas_tv (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(24) UNIQUE NOT NULL,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','ativa','vencida','cancelada')),
    valor NUMERIC(10,2) NOT NULL,
    vencimento DATE NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    ativado_em TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_licencas_tv_chave ON licencas_tv (chave);

-- Valor da licença anual — singleton, mesmo padrão de synk_pix_config.
CREATE TABLE IF NOT EXISTS config_licenca_tv (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    valor_anual NUMERIC(10,2) NOT NULL DEFAULT 99.90
);
INSERT INTO config_licenca_tv (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
