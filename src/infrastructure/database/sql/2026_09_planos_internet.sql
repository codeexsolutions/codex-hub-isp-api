-- Catálogo de planos de internet fixa (fibra) do provedor — não existia até
-- aqui (o plano do cliente sempre vinha ao vivo do IXC/ReceitaNet). Passa a
-- existir pra alimentar a Landing Page do provedor (módulo "landpage"), mas
-- é dado independente — pode ser reaproveitado por qualquer outra tela no
-- futuro. Mesmo padrão de planos_moveis.
CREATE TABLE IF NOT EXISTS planos_internet (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    nome VARCHAR(80) NOT NULL,
    velocidade_mega INTEGER NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    beneficios VARCHAR(200) NULL,
    destaque BOOLEAN NOT NULL DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planos_internet_provedor ON planos_internet (codigo_provedor_fk);
