-- Link de pagamento (Mercado Pago) individual do cliente pra renovar a
-- LISTA IPTV (Xtream) — diferente do PIX da licença do app (config_licenca_tv).
-- Reaproveita o registro de licencas_tv (mesma "chave" que o cliente já usa
-- pra renovar o app) pra também guardar esse link, já que cada cliente tem
-- um link individual no Mercado Pago (não dá pra ter um link único global).
ALTER TABLE licencas_tv ADD COLUMN IF NOT EXISTS link_pagamento_lista VARCHAR(500) NULL;
