-- Valor do acesso IPTV (não da ativação TV em si — essa continua grátis/sem
-- custo pro cliente). O provedor informa esse valor, por código, na hora de
-- gerar a ativação: é o preço que ele cobra do cliente pelo acesso.
ALTER TABLE ativacoes_tv ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2) NULL;

-- Decisão do admin Synk (por provedor): somar, na fatura mensal que o
-- provedor paga pra Synk, o total de "valor" das ativações TV usadas
-- (usado_em) dentro do mês da competência — ver GarantirFaturaDoMes.
ALTER TABLE provedor_assinaturas ADD COLUMN IF NOT EXISTS somar_ativacao_tv BOOLEAN NOT NULL DEFAULT false;
