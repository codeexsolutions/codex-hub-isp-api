-- Exclusão lógica de provedor (ex.: inadimplência com 3+ faturas em aberto).
-- Não apaga nada em cascata — só marca quando foi excluído e desativa o
-- acesso (status = 'INATIVO', já verificado pelo TokenService no login).
-- Some da listagem de faturamento e pode ser revertido no banco se preciso.
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMP NULL;
