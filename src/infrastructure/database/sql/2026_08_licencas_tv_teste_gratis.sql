-- Libera 7 dias de teste grátis assim que a licença é solicitada — o cliente
-- já entra usando o app na hora, sem esperar aprovação de pagamento. O PIX
-- continua disponível durante o teste; se não pagar até vencer, vira "vencida"
-- (mesma varredura que já expira licença "ativa").
ALTER TABLE licencas_tv DROP CONSTRAINT IF EXISTS licencas_tv_status_check;
ALTER TABLE licencas_tv ADD CONSTRAINT licencas_tv_status_check
    CHECK (status IN ('pendente','teste','ativa','vencida','cancelada'));
ALTER TABLE licencas_tv ALTER COLUMN status SET DEFAULT 'teste';
