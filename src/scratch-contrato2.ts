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
    const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
    const service = new RequestService(urlBase);

    const configReques: configRequest = {
        method: emethodHttp.POST,
        resource: "cliente_contrato_imprimir_contrato_17678",
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Basic ${api.Token(provedor)}`
        },
        body: { id: "1259" }
    };
    const response = await service.Requst(configReques);
    console.log("content-type:", response.headers.get("content-type"));
    const text = await response.text();
    console.log("tamanho total:", text.length);
    console.log("primeiros 60 chars:", JSON.stringify(text.slice(0,60)));
    console.log("ultimos 60 chars:", JSON.stringify(text.slice(-60)));
    try {
        const parsed = JSON.parse(text);
        console.log("é JSON valido, tipo:", typeof parsed, Array.isArray(parsed) ? "array" : Object.keys(parsed || {}));
    } catch {
        console.log("NAO é JSON valido -> é base64 cru");
    }
}
main().catch(e => console.error("ERRO", e));
