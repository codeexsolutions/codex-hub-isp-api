-- URL padrão do servidor Xtream Codes usada pelo app de TV (Android TV) quando o
-- cliente não informa uma própria na tela de login — singleton, mesmo padrão de
-- synk_pix_config/config_comissao.
CREATE TABLE IF NOT EXISTS iptv_config (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    url_padrao VARCHAR(200) NOT NULL DEFAULT '',
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO iptv_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
