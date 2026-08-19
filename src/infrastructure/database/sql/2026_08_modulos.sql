-- Módulos vendáveis por provedor (ex.: "beneficios"). Ativação/desativação é feita
-- pela tela de admin interna do painel (login separado, não é o provedor que se auto-ativa).
-- Rode manualmente no Postgres/Supabase (mesmo banco de marketing_beneficios).

CREATE TABLE IF NOT EXISTS provedor_modulos (
    id SERIAL PRIMARY KEY,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    modulo VARCHAR(40) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ativado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (codigo_provedor_fk, modulo)
);

CREATE INDEX IF NOT EXISTS idx_provedor_modulos_provedor
    ON provedor_modulos (codigo_provedor_fk);
