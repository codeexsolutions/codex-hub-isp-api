-- Configuração da Home do app por provedor: quais blocos aparecem pro cliente.
-- 1 linha por provedor, tudo ativo por padrão (comportamento igual ao de hoje
-- pra quem nunca configurar nada).
CREATE TABLE IF NOT EXISTS provedor_home_config (
    codigo_provedor_fk BIGINT PRIMARY KEY REFERENCES provedores(codigo_provedor),
    banner BOOLEAN NOT NULL DEFAULT true,
    fatura BOOLEAN NOT NULL DEFAULT true,
    consumo BOOLEAN NOT NULL DEFAULT true,
    atalhos BOOLEAN NOT NULL DEFAULT true,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
