-- URL do servidor Xtream (DNS) próprio do provedor, usada pelo app Synk TV
-- em vez da URL padrão global (iptv_config.url_padrao, painel do admin)
-- quando o provedor informa a dele. Fica em branco por padrão, o que
-- significa "usar a do admin".
ALTER TABLE provedores ADD COLUMN IF NOT EXISTS iptv_url_dns VARCHAR(200) NULL;
