-- Igual resource_imprimir (contrato): o botão "Reboot ONU" do IXC é um
-- endpoint próprio por instalação (ex.: radpop_radio_cliente_fibra_26379) —
-- o sufixo numérico é o id do botão configurado dentro do IXC de cada
-- provedor (módulo Provedor > Cliente Fibra/ONU > Integração ONU > Reboot
-- ONU). Sem valor padrão universal; enquanto não configurado, "reiniciar
-- roteador" fica indisponível pro provedor.
ALTER TABLE provedor_ixc_contrato_config ADD COLUMN IF NOT EXISTS resource_reboot_onu VARCHAR(80);
