-- Lista de assuntos de OS configuráveis por provedor (o IXC de cada provedor tem
-- vários "assuntos" cadastrados — não dá pra fixar um só). O cliente escolhe entre
-- esses nomes ao abrir um chamado, e o backend usa o id_assunto_ixc correspondente.
-- provedor_ixc_os_config.id_assunto fica sem uso a partir de agora (mantido só por
-- ser aditivo — nunca removemos coluna).
CREATE TABLE IF NOT EXISTS provedor_ixc_assuntos (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk BIGINT NOT NULL REFERENCES provedores(codigo_provedor),
    nome VARCHAR(60) NOT NULL,
    id_assunto_ixc INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ixc_assuntos_provedor ON provedor_ixc_assuntos (codigo_provedor_fk);
