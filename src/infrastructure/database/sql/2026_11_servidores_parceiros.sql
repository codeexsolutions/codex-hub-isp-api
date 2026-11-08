-- Servidores de IPTV parceiros: o servidor paga uma mensalidade ao Synk e,
-- em troca, os clientes DELE usam o synk-tv sem pagar licença — o app
-- detecta o código parceiro, libera o uso e já usa a URL do servidor
-- (o cliente final só digita usuário e senha do Xtream).
-- Separado de "parceiros" (afiliados/revenda com comissão, ver tabela
-- parceiros) — conceito de negócio diferente, mesma palavra por acaso.
CREATE TABLE IF NOT EXISTS servidores_parceiros (
    id SERIAL PRIMARY KEY,
    nome_servidor VARCHAR(120) NOT NULL,
    codigo_parceiro VARCHAR(20) UNIQUE NOT NULL,
    url_servidor VARCHAR(255) NOT NULL,
    valor_mensal NUMERIC(10,2) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','pendente','cancelado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_servidores_parceiros_codigo ON servidores_parceiros (codigo_parceiro);
