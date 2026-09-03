-- O nome do plano vinha limitado a 30 caracteres e nomes reais de plano
-- (ex: "15GB - LIGAÇÕES E WHATSAPP ILIMITADO") estouram isso. Aumenta pra 80.
ALTER TABLE planos_moveis ALTER COLUMN nome TYPE VARCHAR(80);
