-- PIX do próprio parceiro (chave estática, copia-e-cola) — mostrado pro
-- cliente no app pra ele pagar DIRETO ao parceiro na hora de retirar/usar a
-- oferta. O Synk nunca recebe nem intermedia esse valor; é só exibição.
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS pix_chave VARCHAR(140) NULL;
