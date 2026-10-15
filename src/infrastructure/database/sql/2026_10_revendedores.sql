-- Revendedor de IPTV — papel novo, separado de Admin/Provedor/Parceiro, com
-- painel básico próprio pra gerenciar só as licenças do Synk TV dos próprios
-- clientes (mesma tabela licencas_tv, agora com dono). Conta criada só pelo
-- admin Synk (sem auto-cadastro público).
CREATE TABLE IF NOT EXISTS revendedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(160) NOT NULL,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    senha VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NULL = licença criada pelo admin Synk diretamente (comportamento de hoje,
-- continua funcionando igual). Preenchido = licença de cliente de um
-- revendedor específico, só ele (ou o admin) pode aprovar/cancelar/editar.
ALTER TABLE licencas_tv ADD COLUMN IF NOT EXISTS revendedor_id_fk INTEGER NULL REFERENCES revendedores(id);
