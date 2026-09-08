-- "Por que assinar" e "Apps inclusos" da Landing Page — o próprio provedor
-- monta o conteúdo no painel (sem depender de imagem: ícone é só uma chave
-- que a LP resolve pra um SVG embutido).
CREATE TABLE IF NOT EXISTS provedor_lp_vantagens (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    titulo VARCHAR(60) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    icone VARCHAR(20) NOT NULL DEFAULT 'zap',
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provedor_lp_vantagens_provedor ON provedor_lp_vantagens (codigo_provedor_fk);

CREATE TABLE IF NOT EXISTS provedor_lp_apps (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    nome VARCHAR(40) NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provedor_lp_apps_provedor ON provedor_lp_apps (codigo_provedor_fk);
