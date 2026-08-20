-- Localização do parceiro (cidade/UF) — mostrada no card da oferta pro provedor decidir
-- se faz sentido ativar (evita ativar oferta de um parceiro de outro estado/região, onde
-- o cliente não conseguiria efetivamente usar o benefício). Preenchido pelo admin ao
-- cadastrar/editar o parceiro. Rode manualmente no Postgres/Supabase.

ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) NULL;
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS uf VARCHAR(2) NULL;
