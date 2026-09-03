-- Permite cadastrar não só plano móvel avulso, mas também combo
-- (móvel + internet fibra) num mesmo plano, além de tags de benefício
-- livres pra exibir no card (ex.: "Fale ilimitado", "Waze ilimitado").
ALTER TABLE planos_moveis ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) NOT NULL DEFAULT 'movel' CHECK (tipo IN ('movel','combo'));
ALTER TABLE planos_moveis ADD COLUMN IF NOT EXISTS mega_fibra INTEGER NULL;
ALTER TABLE planos_moveis ADD COLUMN IF NOT EXISTS beneficios VARCHAR(200) NULL;
