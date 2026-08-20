-- Marketplace de ofertas: parceiro cria a oferta, provedor só ativa (pode ser mais de 1
-- provedor pra mesma oferta). Substitui o modelo anterior onde cada benefício pertencia
-- a exatamente 1 provedor. Rode manualmente no Postgres/Supabase (mesmo banco das
-- tabelas de Benefícios/Fase 2/Fase 3).

-- Join N:N oferta <-> provedor. Fonte da verdade de "quais provedores mostram essa
-- oferta" — substitui marketing_beneficios.codigo_provedor_fk pra esse fim.
CREATE TABLE IF NOT EXISTS beneficio_provedores (
    id SERIAL PRIMARY KEY,
    beneficio_id INTEGER NOT NULL REFERENCES marketing_beneficios(id),
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    ativo BOOLEAN NOT NULL DEFAULT true,
    ativado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (beneficio_id, codigo_provedor_fk)
);
CREATE INDEX IF NOT EXISTS idx_beneficio_provedores_provedor ON beneficio_provedores (codigo_provedor_fk);
CREATE INDEX IF NOT EXISTS idx_beneficio_provedores_beneficio ON beneficio_provedores (beneficio_id);

-- codigo_provedor_fk deixa de ser obrigatório: uma oferta nova, criada pelo parceiro,
-- não nasce presa a 1 provedor. Fica só como registro histórico nos benefícios migrados.
ALTER TABLE marketing_beneficios ALTER COLUMN codigo_provedor_fk DROP NOT NULL;

-- Preço cheio (pro "de/por" — desconto = valor_original - valor, calculado na exibição)
-- e campos simples de regra comercial da oferta.
ALTER TABLE marketing_beneficios ADD COLUMN IF NOT EXISTS valor_original NUMERIC(10,2) NULL;
ALTER TABLE marketing_beneficios ADD COLUMN IF NOT EXISTS validade_fim DATE NULL;
ALTER TABLE marketing_beneficios ADD COLUMN IF NOT EXISTS regras TEXT NULL;

-- Snapshot do preço cheio no momento da compra, pro relatório poder mostrar o desconto dado.
ALTER TABLE beneficio_compras ADD COLUMN IF NOT EXISTS valor_original NUMERIC(10,2) NULL;

-- ---------------------------------------------------------------------------------
-- Migração de dados: benefícios existentes (criados pelo provedor, sem parceiro_id_fk)
-- viram ofertas de um parceiro auto-criado, já ativadas só pro provedor que os criou.
-- Idempotente: só mexe em linhas que ainda não têm parceiro_id_fk.
-- ---------------------------------------------------------------------------------
DO $$
DECLARE
    rec RECORD;
    novo_parceiro_id INTEGER;
    usuario_base TEXT;
    usuario_final TEXT;
    contador INTEGER;
BEGIN
    FOR rec IN
        SELECT DISTINCT parceiro, codigo_provedor_fk
        FROM marketing_beneficios
        WHERE parceiro_id_fk IS NULL AND codigo_provedor_fk IS NOT NULL
    LOOP
        usuario_base := lower(regexp_replace(coalesce(rec.parceiro, 'parceiro'), '[^a-zA-Z0-9]+', '', 'g'));
        IF usuario_base = '' THEN
            usuario_base := 'parceiro';
        END IF;
        usuario_final := usuario_base || '_' || rec.codigo_provedor_fk;
        contador := 0;
        WHILE EXISTS (SELECT 1 FROM parceiros WHERE usuario = usuario_final) LOOP
            contador := contador + 1;
            usuario_final := usuario_base || '_' || rec.codigo_provedor_fk || '_' || contador;
        END LOOP;

        -- ativo=false: existe só pra ser dono da oferta migrada, não ganha login automático.
        INSERT INTO parceiros (nome_parceiro, usuario, senha, ativo, codigo_provedor_fk)
        VALUES (coalesce(rec.parceiro, 'Parceiro'), usuario_final, md5(random()::text), false, NULL)
        RETURNING id INTO novo_parceiro_id;

        UPDATE marketing_beneficios
        SET parceiro_id_fk = novo_parceiro_id
        WHERE parceiro IS NOT DISTINCT FROM rec.parceiro
          AND codigo_provedor_fk = rec.codigo_provedor_fk
          AND parceiro_id_fk IS NULL;
    END LOOP;
END $$;

-- Cada benefício existente nasce ativado só pro provedor que já tinha ele.
INSERT INTO beneficio_provedores (beneficio_id, codigo_provedor_fk, ativo)
SELECT id, codigo_provedor_fk, true
FROM marketing_beneficios
WHERE codigo_provedor_fk IS NOT NULL
ON CONFLICT (beneficio_id, codigo_provedor_fk) DO NOTHING;
