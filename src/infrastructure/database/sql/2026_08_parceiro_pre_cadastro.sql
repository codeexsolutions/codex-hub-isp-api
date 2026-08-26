-- Pré-cadastro de parceiro (self-service, ver seção "Parcerias" do synk-lp): o
-- interessado se cadastra sozinho pelo formulário público, mas fica com
-- status='pendente' e ativo=false até o admin revisar e aprovar (define
-- usuario/senha de acesso ao portal do parceiro na hora da aprovação — ver
-- Painel > Admin > Parceiros). Antes disso só existia CriarParceiro, usado
-- pelo próprio admin (usuario/senha já definidos na criação).
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'aprovado' CHECK (status IN ('pendente','aprovado','rejeitado'));
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS observacoes TEXT NULL;
