-- Código de ativação do synk-tv por cliente — gerado pelo provedor e enviado
-- pro cliente específico. Sem isso, o app usava o codigo_provedor (público,
-- usado só pra buscar tema/branding em endpoints sem autenticação) como se
-- fosse segredo de ativação: qualquer pessoa que soubesse (ou adivinhasse,
-- já que é sequencial e pequeno) o codigo_provedor de um provedor com o
-- módulo "app_tv" ativo entrava sem pagar a licença anual.
--
-- Não é amarrada a aparelho nem tem expiração de uso único — mesmo espírito
-- da chave de licenca_tv (ver 2026_08_licencas_tv.sql): o cliente pode digitar
-- de novo em outro aparelho. O provedor pode revogar (status='revogado') se o
-- código vazar ou o cliente cancelar.
CREATE TABLE IF NOT EXISTS ativacoes_tv (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(12) UNIQUE NOT NULL,
    codigo_provedor_fk INTEGER NOT NULL REFERENCES provedores(codigo_provedor),
    cliente_nome VARCHAR(120) NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','revogado')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    usado_em TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_ativacoes_tv_provedor ON ativacoes_tv (codigo_provedor_fk);
