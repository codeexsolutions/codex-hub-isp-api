-- Valor da lista (por novo código de Ativação TV gerado) e desconto mensal,
-- ambos definidos pelo admin Synk por provedor — não pelo provedor. O
-- provedor só gera o código (ver AtivacaoTvTab); pra cada código gerado no
-- mês, valor_lista entra automático na fatura dele. desconto existe pra
-- parceria diferenciada: abate da mensalidade antes de somar a lista.
-- Ver GarantirFaturaDoMes em painel.repository.ts.
ALTER TABLE provedor_assinaturas ADD COLUMN IF NOT EXISTS valor_lista NUMERIC(10,2) NULL;
ALTER TABLE provedor_assinaturas ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) NULL;
