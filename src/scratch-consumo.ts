import "reflect-metadata";
import "./api/container/container";
import { container } from "tsyringe";
import IApiIxcSoftService from "./infrastructure/apis/ixcsoft/interfaces/IApiIxcSoftService";
import IProvedorRepository from "./core/interfaces/IProvedorRepository";

async function main() {
    const api = container.resolve<IApiIxcSoftService>("IApiIxcSoftService");
    const provedorRepo = container.resolve<IProvedorRepository>("IProvedorRepository");
    const codigoProvedor = "2";
    const cpf = "043.999.473-06";

    const provedor: any = await provedorRepo.ObterProvedor(codigoProvedor);
    console.log("provedor dominio:", provedor.DominioIxc);

    const respCliente = await api.ObterClientePorCpfCnpj(cpf, codigoProvedor);
    const cliente = (respCliente.registros ?? []).find((s: any) => s.ativo === "S");
    console.log("cliente encontrado:", cliente ? { id: cliente.id, razao: cliente.razao } : null);
    if (!cliente) return;

    const respContrato = await api.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
    const contratos = (respContrato.registros ?? []).filter((s: any) => s.status === "A");
    console.log("contratos ativos:", contratos.map((c: any) => c.id));
    if (contratos.length < 1) return;

    const contrato = contratos[0];
    const loginResp = await api.ObterLogin(codigoProvedor, contrato.id);
    console.log("login response bruto:", JSON.stringify(loginResp).slice(0, 500));
    const idLogin = loginResp.registros?.[0]?.id;
    console.log("idLogin resolvido:", idLogin);
    if (!idLogin) return;

    const consumoResp = await api.ObterConsumo(idLogin, codigoProvedor);
    console.log("consumo response bruto:", JSON.stringify(consumoResp).slice(0, 1500));
}
main().catch((e) => console.error("ERRO", e));
