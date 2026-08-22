import "reflect-metadata";
import "./api/container/container";
import { container } from "tsyringe";
import IApiIxcSoftService from "./infrastructure/apis/ixcsoft/interfaces/IApiIxcSoftService";
import IProvedorRepository from "./core/interfaces/IProvedorRepository";
import RequestService from "./infrastructure/apis/requesService";
import { configRequest } from "./infrastructure/apis/configRequest";
import { emethodHttp } from "./common/enuns/emethodhttp";

async function main() {
    const api = container.resolve<IApiIxcSoftService>("IApiIxcSoftService");
    const provedorRepo = container.resolve<IProvedorRepository>("IProvedorRepository");
    const provedor: any = await provedorRepo.ObterProvedor("2");

    const contratos = await api.ObterContratoPorIdCliente(1126, "2");
    console.log("Contratos:", JSON.stringify(contratos));

    const idContrato = Number(contratos.registros?.[0]?.id);
    console.log("idContrato:", idContrato);

    const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
    const service = new RequestService(urlBase);

    for (const resource of ["cliente_contrato_imprimir_contrato", "cliente_contrato_imprimir_contrato_17678"]) {
        try {
            const configReques: configRequest = {
                method: emethodHttp.POST,
                resource,
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'Authorization': `Basic ${api.Token(provedor)}`
                },
                body: { id: String(idContrato) }
            };
            const response = await service.Requst(configReques);
            const text = await response.text();
            console.log(`>>> ${resource} OK, tamanho=${text.length}, inicio=`, text.slice(0, 300));
        } catch (e: any) {
            console.log(`>>> ${resource} ERRO:`, e.message);
        }
    }
}
main().catch(e => console.error("ERRO GERAL", e));
