-- Fase 1: rastreio de clique em "Aproveitar benefício" no app, usado para alimentar
-- o card "Benefícios utilizados" do Dashboard do painel (antes fixo em zero).
-- Rode manualmente no Postgres/Supabase (mesmo banco de marketing_beneficios).

CREATE TABLE IF NOT EXISTS beneficio_cliques (
    id SERIAL PRIMARY KEY,
    beneficio_id INTEGER NOT NULL REFERENCES marketing_beneficios(id),
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficio_cliques_provedor
    ON beneficio_cliques (codigo_provedor_fk);
CREATE INDEX IF NOT EXISTS idx_beneficio_cliques_beneficio
    ON beneficio_cliques (beneficio_id);
