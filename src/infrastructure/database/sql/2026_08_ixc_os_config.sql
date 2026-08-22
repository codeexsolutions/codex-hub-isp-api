-- Configuração necessária pra abrir/responder Ordem de Serviço no IXC — os IDs de
-- assunto/filial/setor/evento são específicos de cada instalação (cada provedor
-- cadastra os seus dentro do próprio IXC), então não tem valor padrão universal.
-- Enquanto não configurado, abrir/responder chamado fica indisponível pro provedor.
CREATE TABLE IF NOT EXISTS provedor_ixc_os_config (
    codigo_provedor_fk BIGINT PRIMARY KEY REFERENCES provedores(codigo_provedor),
    id_assunto INTEGER,
    id_filial INTEGER,
    setor INTEGER,
    id_evento_mensagem INTEGER,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
