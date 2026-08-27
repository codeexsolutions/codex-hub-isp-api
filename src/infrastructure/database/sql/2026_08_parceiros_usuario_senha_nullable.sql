-- Pré-cadastro público de parceiro (Parceiro.repository.ts::PreCadastrar) cria a linha
-- sem usuario/senha; essas credenciais só são definidas depois, na aprovação pelo admin
-- (painel.repository.ts::AprovarParceiro). Colunas precisam aceitar NULL até esse momento.
ALTER TABLE parceiros ALTER COLUMN usuario DROP NOT NULL;
ALTER TABLE parceiros ALTER COLUMN senha DROP NOT NULL;
