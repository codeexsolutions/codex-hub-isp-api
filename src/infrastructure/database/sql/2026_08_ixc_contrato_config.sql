-- O "recurso" de impressão de contrato no IXC é um endpoint próprio por instalação
-- (ex.: cliente_contrato_imprimir_contrato_17678) — o sufixo numérico é o id do
-- modelo/relatório de contrato configurado dentro do IXC de cada provedor, então
-- não tem valor padrão universal. Enquanto não configurado, "ver contrato" fica
-- indisponível pro provedor (mesmo padrão de provedor_ixc_os_config).
CREATE TABLE IF NOT EXISTS provedor_ixc_contrato_config (
    codigo_provedor_fk BIGINT PRIMARY KEY REFERENCES provedores(codigo_provedor),
    resource_imprimir VARCHAR(80),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
