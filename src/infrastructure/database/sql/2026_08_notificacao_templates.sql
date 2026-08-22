-- Modelos de notificação reutilizáveis pelo provedor (evita digitar a mesma
-- mensagem toda vez). Suportam variáveis de texto livre tipo {nome}/{valor}/
-- {vencimento} — {provedor} é preenchido automaticamente ao aplicar o modelo,
-- os demais o provedor ajusta manualmente antes de enviar.
CREATE TABLE IF NOT EXISTS provedor_notificacao_templates (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk BIGINT NOT NULL REFERENCES provedores(codigo_provedor),
    nome VARCHAR(60) NOT NULL,
    titulo VARCHAR(65) NOT NULL,
    corpo VARCHAR(240) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificacao_templates_provedor ON provedor_notificacao_templates (codigo_provedor_fk);
