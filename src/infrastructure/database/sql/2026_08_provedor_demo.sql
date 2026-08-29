-- Ambiente de demonstração pra prospect testar o app do assinante e o painel
-- do provedor sem precisar de conta real. codigo_provedor fixo em 999 (fora
-- da sequência normal) pra não colidir com provedores reais e ser fácil de
-- divulgar na landing page. gerenciador = RECEITANET porque é o caminho de
-- login só-por-CPF (sem usuário/senha extra) — os dados de cliente não vêm
-- de uma chamada real ao ReceitaNet: ApiReceitanetServices intercepta esse
-- codigo_provedor específico e devolve dados fabricados (ver mockDemo.ts),
-- então não precisa (nem pode) de codigo_api_gerenciador/chave_api_gerenciador
-- reais.
INSERT INTO provedores (codigo_provedor, empresa, nome_fantasia, gerenciador, status, usuario, senha, nome_administrador)
VALUES (999, 'Synk Net Telecom (demonstração)', 'Synk Net', 'RECEITANET', 'ATIVO', 'demo', 'demo1234', 'Equipe Synk')
ON CONFLICT (codigo_provedor) DO UPDATE SET
    empresa = EXCLUDED.empresa,
    nome_fantasia = EXCLUDED.nome_fantasia,
    gerenciador = EXCLUDED.gerenciador,
    status = EXCLUDED.status,
    usuario = EXCLUDED.usuario,
    senha = EXCLUDED.senha;

INSERT INTO theme (codigo_provedor_fk, tag, accent, accent2, logo_url)
VALUES (999, 'DEMO', '#2563EB', '#7C3AED', NULL)
ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
    tag = EXCLUDED.tag, accent = EXCLUDED.accent, accent2 = EXCLUDED.accent2;

INSERT INTO provedor_home_config (codigo_provedor_fk, banner, fatura, consumo, atalhos)
VALUES (999, true, true, true, true)
ON CONFLICT (codigo_provedor_fk) DO NOTHING;

INSERT INTO provedor_atendimento (codigo_provedor_fk, whatsapp, site)
VALUES (999, '5585992989066', 'https://synkisp.com.br')
ON CONFLICT (codigo_provedor_fk) DO NOTHING;

INSERT INTO provedor_modulos (codigo_provedor_fk, modulo, ativo)
VALUES (999, 'beneficios', true), (999, 'recompensas', true), (999, 'desbloqueio_confianca', true)
ON CONFLICT (codigo_provedor_fk, modulo) DO UPDATE SET ativo = true;

-- Uma oferta de exemplo, já ativada pro provedor demo, pra aba de Benefícios
-- não aparecer vazia.
INSERT INTO marketing_beneficios (id, categoria, parceiro, titulo, subtitulo, descricao, valor, valor_original, ativo)
VALUES (999, 'Alimentação', 'Pizzaria Demonstração', '30% OFF na pizza grande', 'Válido de seg a qui', 'Oferta de exemplo só pra ilustrar o marketplace de benefícios no ambiente de demonstração.', 34.90, 49.90, true)
ON CONFLICT (id) DO UPDATE SET ativo = true;

INSERT INTO beneficio_provedores (beneficio_id, codigo_provedor_fk, ativo)
VALUES (999, 999, true)
ON CONFLICT (beneficio_id, codigo_provedor_fk) DO UPDATE SET ativo = true;

INSERT INTO pontos_recompensas (codigo_provedor_fk, titulo, descricao, pontos_necessarios, ativo)
SELECT 999, '1 mês de Wi-Fi grátis', 'Recompensa de exemplo do ambiente de demonstração.', 500, true
WHERE NOT EXISTS (SELECT 1 FROM pontos_recompensas WHERE codigo_provedor_fk = 999);

-- codigo_provedor=999 e marketing_beneficios.id=999 foram inseridos com valor
-- explícito (fora da sequência) — realinha as sequências pra não colidir
-- quando um provedor/benefício real futuro for criado normalmente.
SELECT setval('codigo_provedor_seq', GREATEST((SELECT MAX(codigo_provedor) FROM provedores), (SELECT last_value FROM codigo_provedor_seq)));
SELECT setval('marketing_beneficios_id_seq', GREATEST((SELECT MAX(id) FROM marketing_beneficios), (SELECT last_value FROM marketing_beneficios_id_seq)));
