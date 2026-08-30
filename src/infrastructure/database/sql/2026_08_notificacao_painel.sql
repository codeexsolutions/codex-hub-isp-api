-- Central de notificações do PAINEL (provedor) — separada da central de
-- notificações do CLIENTE (notificacao_cliente/push_subscription, que já
-- existem e são pro app do assinante). Primeiro uso: avisar o provedor
-- quando um cliente abre um chamado novo, já que o ReceitaNet não notifica
-- isso — o próprio Chamado.controller.ts intercepta a abertura (a chamada já
-- passa pela nossa API) e dispara a notificação na hora.
CREATE TABLE IF NOT EXISTS push_subscription_painel (
    id SERIAL PRIMARY KEY,
    codigo_provedor TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    device_name VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (codigo_provedor, endpoint)
);

CREATE TABLE IF NOT EXISTS notificacao_painel (
    id SERIAL PRIMARY KEY,
    codigo_provedor TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'geral',
    titulo VARCHAR(140) NOT NULL,
    corpo TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificacao_painel_provedor ON notificacao_painel (codigo_provedor, criado_em DESC);
