-- Identidade própria do Clube de Benefícios por provedor (nome + mensagem de
-- apresentação), exibida no lugar do "Benefícios" genérico no app.
CREATE TABLE IF NOT EXISTS provedor_clube_beneficios (
    codigo_provedor_fk BIGINT PRIMARY KEY REFERENCES provedores(codigo_provedor),
    nome VARCHAR(60),
    mensagem VARCHAR(160),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
