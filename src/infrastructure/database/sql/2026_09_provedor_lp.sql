-- Landing Page pública do provedor (módulo "landpage") — 1 linha por
-- provedor. headline/subheadline/cidade são opcionais: quando vazios, a LP
-- usa um texto padrão de destaque gerado a partir do próprio nome do
-- provedor (ver ProvedorServices.ObterLpPublica), pra funcionar "pronta"
-- sem exigir preenchimento manual.
CREATE TABLE IF NOT EXISTS provedor_lp_config (
    codigo_provedor_fk INTEGER PRIMARY KEY REFERENCES provedores(codigo_provedor),
    ativa BOOLEAN NOT NULL DEFAULT false,
    headline VARCHAR(140) NULL,
    subheadline VARCHAR(220) NULL,
    cidade VARCHAR(80) NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
