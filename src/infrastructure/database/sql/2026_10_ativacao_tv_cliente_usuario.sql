-- Usuário (login) do cliente na lista de IPTV/Xtream, guardado à parte do
-- nome — ajuda o provedor a achar o cliente certo na lista do painel IPTV
-- mesmo se o nome for apagado ou ficar desatualizado. Editável a qualquer
-- momento pelo provedor (ver AtivacaoTvTab).
ALTER TABLE ativacoes_tv ADD COLUMN IF NOT EXISTS cliente_usuario VARCHAR(80) NULL;
