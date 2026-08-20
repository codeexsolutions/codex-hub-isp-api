-- Endereço e contato do parceiro — mostrado pro cliente no app, junto com a oferta,
-- pra ele já saber onde e como usar o cupom (evita chegar no local errado ou não
-- conseguir contato). Preenchido pelo admin ao cadastrar/editar o parceiro, junto
-- com cidade/UF. Rode manualmente no Postgres/Supabase.

ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS endereco TEXT NULL;
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS contato VARCHAR(30) NULL;
