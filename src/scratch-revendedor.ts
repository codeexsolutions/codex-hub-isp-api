import "reflect-metadata";
import "./api/container/container";
import { container } from "tsyringe";
import IPainelServices from "./application/interfaces/IPainelService";
import IRevendedorServices from "./application/interfaces/IRevendedorServices";

async function main() {
    const painel = container.resolve<IPainelServices>("IPainelServices");
    const revendedorServices = container.resolve<IRevendedorServices>("IRevendedorServices");

    const usuario = `teste_revendedor_${Date.now()}`;
    const revendedor = await painel.CriarRevendedor("Revendedor Teste", usuario, "senha123");
    console.log("1) Revendedor criado:", revendedor);

    const token = await revendedorServices.Login(usuario, "senha123");
    console.log("2) Login OK, token gerado (len):", token.length);

    const licenca = await revendedorServices.CriarLicenca(revendedor.id, "Cliente Teste", "85999998888");
    console.log("3) Licença criada:", licenca.chave, licenca.status, licenca.valor);

    const comLink = await revendedorServices.DefinirLinkPagamentoLista(licenca.id, revendedor.id, "https://mpago.la/teste123");
    console.log("4) Link da lista definido:", comLink.link_pagamento_lista);

    const aprovada = await revendedorServices.AprovarLicenca(licenca.id, revendedor.id);
    console.log("5) Licença aprovada:", aprovada.status, aprovada.vencimento);

    const minhas = await revendedorServices.ListarMinhasLicencas(revendedor.id);
    console.log("6) Licenças do revendedor:", minhas.length);

    // Garante isolamento: outro "revendedor" não enxerga nem edita essa licença.
    try {
        await revendedorServices.CancelarLicenca(licenca.id, 999999);
        console.log("7) FALHA: deveria ter bloqueado revendedor errado");
    } catch (e: any) {
        console.log("7) OK, bloqueado corretamente:", e.message);
    }

    // Limpeza
    await painel.DefinirStatusRevendedor(revendedor.id, false);
    console.log("8) Revendedor desativado (limpeza)");
}
main().catch((e) => console.error("ERRO", e));
