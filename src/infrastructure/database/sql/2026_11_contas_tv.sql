-- Conta própria do cliente final do synk-tv (nome/email/senha, estilo
-- Netflix) — substitui, pra cadastro novo, o fluxo antigo de chave de
-- licença manual (licencas_tv). No cadastro o backend já gera um teste
-- IPTV automático (ver links_teste_iptv/DeylerTrialService) e grava as
-- credenciais aqui; o cliente nunca as digita.
CREATE TABLE IF NOT EXISTS contas_tv (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(120) NOT NULL,
    iptv_usuario VARCHAR(60),
    iptv_senha VARCHAR(60),
    iptv_dns VARCHAR(160),
    iptv_pacote VARCHAR(120),
    iptv_vencimento TIMESTAMPTZ,
    link_pagamento TEXT,
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pendente'
        CHECK (status_pagamento IN ('pendente','pago','expirado')),
    -- Pro sininho do admin: marcado quando ele abre/vê o cadastro novo.
    notificado BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contas_tv_email ON contas_tv (email);
