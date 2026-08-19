-- Escopo de parceiro por provedor: NULL = nacional (visível pra todos os provedores),
-- preenchido = só o provedor dono enxerga esse parceiro.
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS codigo_provedor_fk INTEGER NULL REFERENCES provedores(codigo_provedor);
